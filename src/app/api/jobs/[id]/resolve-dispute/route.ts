import { NextResponse } from "next/server";
import { ERC8183_CONTRACT_ADDRESS, erc8183Abi } from "@/lib/arc";
import {
  getServiceClientOrResponse,
  parseJson,
  resolveDisputeSchema,
  validationError,
} from "@/lib/api";
import { verifyArcTransaction } from "@/lib/server/arc-verify";
import { invalidateBootstrapCache } from "@/lib/server/cache";
import { walletRateLimit } from "@/lib/server/rate-limit";
import { requireWalletSession } from "@/lib/server/wallet-session";
import { readEscrowOwner } from "@/lib/wallet";
import { TABLES } from "@/lib/supabase/tables";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const parsed = await parseJson(request, resolveDisputeSchema);
  if (!parsed.success) return validationError(parsed.error);

  const { id } = await context.params;
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;
  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;
  const limited = await walletRateLimit(request, session.profileId, "jobs:resolve-dispute");
  if (limited) return limited;

  const input = parsed.data;

  // Only the escrow contract owner can resolve a dispute. The onchain
  // resolveDispute is onlyOwner, so a successful tx already proves ownership,
  // but we reject early here for a clearer error.
  let escrowOwner: string;
  try {
    escrowOwner = await readEscrowOwner();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not read escrow owner." },
      { status: 502 },
    );
  }
  if (escrowOwner.toLowerCase() !== session.walletAddress.toLowerCase()) {
    return NextResponse.json(
      { error: "Only the escrow contract owner can resolve disputes." },
      { status: 403 },
    );
  }

  const { data: targetJob, error: targetJobError } = await supabase
    .from(TABLES.jobs)
    .select("arc_job_id,status")
    .eq("id", id)
    .single();

  if (targetJobError) return NextResponse.json({ error: targetJobError.message }, { status: 404 });
  if (!targetJob.arc_job_id) {
    return NextResponse.json({ error: "Job has no onchain id to resolve." }, { status: 400 });
  }
  if (targetJob.status !== "disputed") {
    return NextResponse.json({ error: "Only disputed jobs can be resolved." }, { status: 400 });
  }

  let blockNumber = input.blockNumber;
  try {
    const receipt = await verifyArcTransaction({
      abi: erc8183Abi,
      expectedFrom: session.walletAddress,
      expectedFunctionName: "resolveDispute",
      expectedTo: ERC8183_CONTRACT_ADDRESS,
      txHash: input.resolveTxHash,
    });
    blockNumber = Number(receipt.blockNumber);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Arc resolveDispute transaction could not be verified.",
      },
      { status: 400 },
    );
  }

  // Mirror the contract: providerAmount === 0 cancels, otherwise completes.
  const status = input.providerAmountUsdcUnits > 0 ? "completed" : "cancelled";

  const { error: updateError } = await supabase
    .from(TABLES.jobs)
    .update({
      status,
      complete_tx_hash: input.resolveTxHash,
      last_indexed_block: blockNumber,
    })
    .eq("id", id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  await supabase.from(TABLES.transactions).insert({
    job_id: id,
    contract_address: ERC8183_CONTRACT_ADDRESS,
    method: "resolveDispute",
    tx_hash: input.resolveTxHash,
    status: "confirmed",
    block_number: blockNumber,
    profile_id: session.profileId,
    metadata: {
      provider_amount_usdc_units: input.providerAmountUsdcUnits,
      reason_hash_bytes32: input.reasonHashBytes32,
      resolution: status,
    },
    confirmed_at: new Date().toISOString(),
  });

  await invalidateBootstrapCache();
  return NextResponse.json({ ok: true, status });
}
