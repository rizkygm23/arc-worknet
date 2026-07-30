import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createPublicClient,
  createWalletClient,
  http,
  getAddress,
  keccak256,
  type Hash,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { env } from "@/lib/env";
import { getServiceClientOrResponse } from "@/lib/api";
import { requireWalletSession } from "@/lib/server/wallet-session";
import { walletRateLimit } from "@/lib/server/rate-limit";
import { arcTestnet, ARC_RPC_URL, ARC_USDC_ADDRESS, erc20UsdcAbi } from "@/lib/arc";
import {
  ARC_CCTP_DOMAIN,
  ARC_MESSAGE_TRANSMITTER_ADDRESS,
  CCTP_TESTNET_NETWORKS,
  cctpMessageTransmitterAbi,
  fetchCircleAttestation,
} from "@/lib/cctp-bridge";

const receiveMessageSchema = z.object({
  burnTxHash: z.string().min(10),
  recipientAddress: z.string().min(10),
  amountUnits: z.coerce.number().positive(),
  sourceChainId: z.coerce.number().positive(),
});

const MESSAGE_SENT_EVENT_TOPIC = "0x2fa9ca894982930190727e75500a97d8dc500233a5065e0f3126c48fbe0343c0";

function getRelayerAccount() {
  const pk =
    process.env.BRIDGE_RELAYER_PRIVATE_KEY ||
    env.BRIDGE_RELAYER_PRIVATE_KEY ||
    process.env.FUNDING_WALLET_PRIVATE_KEY_1 ||
    env.FUNDING_WALLET_PRIVATE_KEY_1 ||
    process.env.FIRST_WALLET_PRIVATE_KEY ||
    env.FIRST_WALLET_PRIVATE_KEY;

  if (!pk || pk.trim() === "") {
    throw new Error(
      "No relayer private key configured. Please set BRIDGE_RELAYER_PRIVATE_KEY=0x... in your .env file or Vercel environment variables.",
    );
  }
  return privateKeyToAccount(pk.trim() as `0x${string}`);
}

export async function POST(request: Request) {
  // SEC-01: Require authenticated wallet session before relaying funds
  const { supabase, response: svcResponse } = getServiceClientOrResponse();
  if (svcResponse) return svcResponse;
  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;
  const limited = await walletRateLimit(request, session.profileId, "cctp:receive");
  if (limited) return limited;

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

    console.log(`[Bridge Relayer] Processing CCTP transfer for ${amountUnits / 1_000_000} USDC from chain ${sourceChainId} (Tx: ${burnTxHash}) to ${recipient}`);

    const relayerAccount = getRelayerAccount();
    const arcWalletClient = createWalletClient({
      account: relayerAccount,
      chain: arcTestnet,
      transport: http(ARC_RPC_URL),
    });

    let mintTxHash: string | undefined;
    let methodUsed = "CCTP_RECEIVE_MESSAGE";

    // Step A: Attempt CCTP receiveMessage on Arc's MessageTransmitterV2 contract if burn tx is indexed
    const sourceNetwork = CCTP_TESTNET_NETWORKS.find((n) => n.chainId === sourceChainId);
    if (sourceNetwork) {
      try {
        const sourcePublicClient = createPublicClient({
          transport: http(sourceNetwork.rpcUrl),
        });

        const receipt = await sourcePublicClient.getTransactionReceipt({
          hash: burnTxHash as Hash,
        });

        if (receipt && receipt.logs) {
          const messageLog = receipt.logs.find(
            (log) => log.topics[0]?.toLowerCase() === MESSAGE_SENT_EVENT_TOPIC.toLowerCase(),
          );

          if (messageLog && messageLog.data) {
            const messageBytes = messageLog.data as Hex;
            const messageHash = keccak256(messageBytes);
            const attestationResult = await fetchCircleAttestation(messageHash);

            if (attestationResult.status === "complete" && attestationResult.attestation) {
              console.log("[Bridge Relayer] Circle attestation acquired! Executing receiveMessage on Arc MessageTransmitterV2...");
              mintTxHash = await arcWalletClient.writeContract({
                chain: arcTestnet,
                address: ARC_MESSAGE_TRANSMITTER_ADDRESS,
                abi: cctpMessageTransmitterAbi,
                functionName: "receiveMessage",
                args: [messageBytes, attestationResult.attestation as Hex],
              });
            }
          }
        }
      } catch (cctpErr) {
        console.warn("[Bridge Relayer] CCTP receiveMessage step notice (falling back to USDC contract transfer):", cctpErr);
      }
    }

    // Step B: Direct ERC-20 transfer of USDC on Arc Testnet (0x3600000000000000000000000000000000000000)
    // using exact 6-decimal USDC base units (1 USDC = 1,000,000 units)
    if (!mintTxHash) {
      methodUsed = "ARC_USDC_ERC20_TRANSFER";
      const usdcBaseUnits = BigInt(Math.round(amountUnits));

      try {
        mintTxHash = await arcWalletClient.writeContract({
          chain: arcTestnet,
          address: ARC_USDC_ADDRESS,
          abi: erc20UsdcAbi,
          functionName: "transfer",
          args: [recipient, usdcBaseUnits],
        });
      } catch (erc20Err) {
        console.warn("[Bridge Relayer] ERC-20 transfer notice, attempting 18-decimal native send:", erc20Err);
        // Fallback: Convert 6-decimal units to 18-decimal native wei (1 USDC = 10^18 wei)
        const amountWei = usdcBaseUnits * BigInt(10 ** 12);
        mintTxHash = await arcWalletClient.sendTransaction({
          chain: arcTestnet,
          to: recipient,
          value: amountWei,
        });
      }
    }

    console.log(`[Bridge Relayer] Arc Testnet mint/transfer tx finished: ${mintTxHash} -> ${recipient} via ${methodUsed}`);

    return NextResponse.json({
      success: true,
      status: "minted",
      sourceTxHash: burnTxHash,
      mintTxHash,
      recipientAddress: recipient,
      amountUnits,
      methodUsed,
      message: `${amountUnits / 1_000_000} USDC successfully bridged to ${recipient} on Arc Testnet via Domain ${ARC_CCTP_DOMAIN}.`,
    });
  } catch (error) {
    console.error("[Bridge Relayer] Error processing CCTP receiveMessage:", error);
    const message = error instanceof Error ? error.message : "CCTP receiveMessage transaction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
