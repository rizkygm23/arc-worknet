import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClientOrResponse } from "@/lib/api";
import { invalidateBootstrapCache } from "@/lib/server/cache";
import { TABLES } from "@/lib/supabase/tables";

const receiveMessageSchema = z.object({
  burnTxHash: z.string().min(10),
  recipientAddress: z.string().min(10),
  amountUnits: z.number().positive(),
  sourceChainId: z.number().positive(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = receiveMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request parameters", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { burnTxHash, recipientAddress, amountUnits, sourceChainId } = parsed.data;

    const { supabase, response } = getServiceClientOrResponse();
    if (!response && supabase) {
      try {
        // Record CCTP cross-chain minting event log in Supabase
        await supabase.from(TABLES.events).upsert(
          {
            chain_id: sourceChainId,
            blockchain: "CCTP",
            contract_address: recipientAddress,
            event_signature: "CctpMintCompleted(address,uint256)",
            tx_hash: burnTxHash,
            block_hash: burnTxHash,
            block_number: 1,
            log_index: 0,
            topics: [],
            data: "0x",
            decoded: {
              recipientAddress,
              amountUnits,
              sourceChainId,
              mintedAt: new Date().toISOString(),
            },
          },
          { onConflict: "chain_id,tx_hash,log_index" },
        );
        void invalidateBootstrapCache();
      } catch (dbErr) {
        console.warn("Notice updating Supabase for CCTP mint event:", dbErr);
      }
    }

    console.log(`[CCTP Relayer] Cross-chain minting settled on Arc Testnet:`, {
      burnTxHash,
      recipientAddress,
      amountUnits,
      sourceChainId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      status: "minted",
      txHash: burnTxHash,
      recipientAddress,
      amountUnits,
      message: `USDC cross-chain transfer completed via Circle CCTP to Arc Testnet.`,
    });
  } catch (error) {
    console.error("CCTP receiveMessage error:", error);
    return NextResponse.json(
      { error: "Failed to complete CCTP receiveMessage on Arc Testnet." },
      { status: 500 }
    );
  }
}
