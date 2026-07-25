import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createPublicClient,
  createWalletClient,
  http,
  getAddress,
  type Hash,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet, ARC_RPC_URL } from "@/lib/arc";

const receiveMessageSchema = z.object({
  burnTxHash: z.string().min(10),
  recipientAddress: z.string().min(10),
  amountUnits: z.coerce.number().positive(),
  sourceChainId: z.coerce.number().positive(),
});

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

    console.log(`[Bridge Relayer] Processing cross-chain transfer for ${amountUnits / 1_000_000} USDC from chain ${sourceChainId} (Tx: ${burnTxHash}) to ${recipient}`);

    // Send native USDC on Arc Testnet to the recipient wallet
    const relayerAccount = getRelayerAccount();
    const arcWalletClient = createWalletClient({
      account: relayerAccount,
      chain: arcTestnet,
      transport: http(ARC_RPC_URL),
    });

    let mintTxHash: string;
    try {
      // Approach 1: Send raw 6-decimal base units (Arc Testnet native currency = USDC, 6 decimals)
      mintTxHash = await arcWalletClient.sendTransaction({
        to: recipient,
        value: BigInt(Math.round(amountUnits)),
      });
    } catch (err1) {
      console.warn("[Bridge Relayer] 6-decimal value send notice, attempting 18-decimal:", err1);
      // Approach 2: Convert 6-decimal base units to 18-decimal wei
      const amountWei = BigInt(Math.round(amountUnits)) * BigInt(10 ** 12);
      mintTxHash = await arcWalletClient.sendTransaction({
        to: recipient,
        value: amountWei,
      });
    }

    console.log(`[Bridge Relayer] Arc Testnet transfer tx sent: ${mintTxHash} -> ${recipient}`);

    return NextResponse.json({
      success: true,
      status: "minted",
      sourceTxHash: burnTxHash,
      mintTxHash,
      recipientAddress: recipient,
      amountUnits,
      message: `${amountUnits / 1_000_000} USDC successfully bridged to ${recipient} on Arc Testnet.`,
    });
  } catch (error) {
    console.error("[Bridge Relayer] Error processing cross-chain mint:", error);
    const message = error instanceof Error ? error.message : "Relayer transaction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
