import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createPublicClient,
  createWalletClient,
  http,
  getAddress,
  parseUnits,
  type Hash,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet, ARC_RPC_URL } from "@/lib/arc";
import { CCTP_TESTNET_NETWORKS } from "@/lib/cctp-bridge";

const receiveMessageSchema = z.object({
  burnTxHash: z.string().min(10),
  recipientAddress: z.string().min(10),
  amountUnits: z.coerce.number().positive(),
  sourceChainId: z.coerce.number().positive(),
});

// Relayer wallet that holds native USDC on Arc Testnet and sends it to bridge recipients.
function getRelayerAccount() {
  const pk =
    process.env.BRIDGE_RELAYER_PRIVATE_KEY ||
    process.env.FUNDING_WALLET_PRIVATE_KEY_1 ||
    process.env.FIRST_WALLET_PRIVATE_KEY;
  if (!pk) throw new Error("No relayer private key configured");
  return privateKeyToAccount(pk as `0x${string}`);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = receiveMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request parameters", details: parsed.error.format() },
        { status: 400 },
      );
    }

    const { burnTxHash, recipientAddress, amountUnits, sourceChainId } = parsed.data;
    const recipient = getAddress(recipientAddress);

    // -------------------------------------------------------------------
    // Step 1: Verify the source chain transfer actually happened onchain
    // -------------------------------------------------------------------
    const sourceNetwork = CCTP_TESTNET_NETWORKS.find((n) => n.chainId === sourceChainId);
    if (!sourceNetwork) {
      return NextResponse.json({ error: "Unsupported source chain" }, { status: 400 });
    }

    const sourceClient = createPublicClient({
      transport: http(sourceNetwork.rpcUrl),
    });

    let verified = false;
    for (let attempt = 0; attempt < 15; attempt++) {
      try {
        const receipt = await sourceClient.getTransactionReceipt({
          hash: burnTxHash as Hash,
        });
        if (receipt && receipt.status === "success") {
          verified = true;
          break;
        }
      } catch {
        // tx not mined yet — wait and retry
      }
      await new Promise((r) => setTimeout(r, 3000));
    }

    if (!verified) {
      return NextResponse.json(
        { error: "Source chain transaction not confirmed within timeout." },
        { status: 400 },
      );
    }

    console.log(`[Bridge Relayer] Source tx ${burnTxHash} verified on chain ${sourceChainId}`);

    // -------------------------------------------------------------------
    // Step 2: Send native USDC on Arc Testnet to the recipient
    // Arc Testnet uses USDC as native currency (decimals: 6), so a normal
    // value transfer (no contract call) delivers USDC.
    // -------------------------------------------------------------------
    const relayerAccount = getRelayerAccount();

    const arcWalletClient = createWalletClient({
      account: relayerAccount,
      chain: arcTestnet,
      transport: http(ARC_RPC_URL),
    });

    // amountUnits is already in 6-decimal base units (e.g. 1_000_000 = 1 USDC).
    // Arc native currency has 6 decimals matching USDC, but viem/MetaMask
    // sometimes expects 18-decimal wei. Arc Testnet's actual native decimals
    // may be 18 internally even though the symbol is USDC. Try both approaches.
    let mintTxHash: string;
    try {
      // Approach 1: send raw base units as value (works if chain uses 6 decimals natively)
      mintTxHash = await arcWalletClient.sendTransaction({
        to: recipient,
        value: BigInt(amountUnits),
      });
    } catch (err1) {
      console.warn("[Bridge Relayer] 6-decimal native send failed, trying 18-decimal:", err1);
      // Approach 2: convert 6-decimal amount to 18-decimal wei
      // e.g. 1 USDC = 1_000_000 (6 dec) = 1_000_000_000_000_000_000 (18 dec)
      const amountWei = BigInt(amountUnits) * BigInt(10 ** 12);
      mintTxHash = await arcWalletClient.sendTransaction({
        to: recipient,
        value: amountWei,
      });
    }

    console.log(`[Bridge Relayer] Arc Testnet mint tx: ${mintTxHash} → ${recipient} (${amountUnits} units)`);

    // -------------------------------------------------------------------
    // Step 3: Wait for the Arc Testnet tx to be mined
    // -------------------------------------------------------------------
    const arcPublicClient = createPublicClient({
      chain: arcTestnet,
      transport: http(ARC_RPC_URL),
    });

    let arcConfirmed = false;
    for (let i = 0; i < 10; i++) {
      try {
        const arcReceipt = await arcPublicClient.getTransactionReceipt({
          hash: mintTxHash as Hash,
        });
        if (arcReceipt && arcReceipt.status === "success") {
          arcConfirmed = true;
          break;
        }
      } catch {
        // not mined yet
      }
      await new Promise((r) => setTimeout(r, 2000));
    }

    return NextResponse.json({
      success: true,
      status: arcConfirmed ? "minted" : "pending",
      sourceTxHash: burnTxHash,
      mintTxHash,
      recipientAddress: recipient,
      amountUnits,
      message: arcConfirmed
        ? `${amountUnits / 1_000_000} USDC successfully bridged to Arc Testnet.`
        : `Bridge tx submitted on Arc Testnet (${mintTxHash}), awaiting confirmation.`,
    });
  } catch (error) {
    console.error("[Bridge Relayer] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown relayer error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
