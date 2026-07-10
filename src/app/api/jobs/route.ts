import { NextResponse } from "next/server";
import { ARC_TESTNET_CHAIN_ID } from "@/lib/arc";
import {
  createJobSchema,
  getServiceClientOrResponse,
  parseJson,
  validationError,
} from "@/lib/api";
import { env } from "@/lib/env";
import { invalidateBootstrapCache } from "@/lib/server/cache";
import { walletRateLimit } from "@/lib/server/rate-limit";
import { requireWalletSession } from "@/lib/server/wallet-session";
import { TABLES } from "@/lib/supabase/tables";

export async function POST(request: Request) {
  const parsed = await parseJson(request, createJobSchema);
  if (!parsed.success) return validationError(parsed.error);

  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;
  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;
  const limited = await walletRateLimit(request, session.profileId, "jobs:create");
  if (limited) return limited;

  const input = parsed.data;
  if (input.clientProfileId !== session.profileId) {
    return NextResponse.json({ error: "Client profile does not match connected wallet." }, { status: 403 });
  }

  const { data, error } = await supabase
    .from(TABLES.jobs)
    .insert({
      client_profile_id: session.profileId,
      actor_type: input.actorType,
      title: input.title,
      brief: input.brief,
      acceptance_criteria: input.acceptanceCriteria,
      deliverable_format: input.deliverableFormat,
      category: input.category,
      tags: input.tags,
      budget_usdc_units: input.budgetUsdcUnits,
      platform_fee_bps: env.PLATFORM_FEE_BPS,
      deadline_at: input.deadlineAt,
      status: "open",
      arc_chain_id: ARC_TESTNET_CHAIN_ID,
      evaluator_address: session.walletAddress,
      description_hash: input.descriptionHash,
      task_file_path: input.taskFilePath,
      task_file_name: input.taskFileName,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await invalidateBootstrapCache();
  return NextResponse.json({ job: data }, { status: 201 });
}
