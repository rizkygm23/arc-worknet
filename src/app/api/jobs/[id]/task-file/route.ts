import { NextResponse } from "next/server";
import { invalidPathParam, uuidParamSchema, getServiceClientOrResponse } from "@/lib/api";
import { walletRateLimit } from "@/lib/server/rate-limit";
import { requireWalletSession } from "@/lib/server/wallet-session";
import { TABLES } from "@/lib/supabase/tables";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const parsedId = uuidParamSchema.safeParse((await context.params).id);
  if (!parsedId.success) return invalidPathParam();

  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;

  // The task file ships with the public job listing for prospective applicants,
  // but requires a signed-in wallet so anonymous scrapers cannot enumerate it.
  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;
  const limited = await walletRateLimit(request, session.profileId, "jobs:task-file");
  if (limited) return limited;

  const { data: job, error: jobError } = await supabase
    .from(TABLES.jobs)
    .select("task_file_path,task_file_name")
    .eq("id", parsedId.data)
    .single();

  if (jobError || !job || !job.task_file_path) {
    return NextResponse.json({ error: "Task file not found." }, { status: 404 });
  }

  // Create a signed download URL valid for 1 hour
  const { data: signed, error: signError } = await supabase.storage
    .from("deliverables")
    .createSignedUrl(job.task_file_path, 3600, {
      download: job.task_file_name ?? true,
    });

  if (signError || !signed) {
    return NextResponse.json({ error: "Could not retrieve task file." }, { status: 502 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
export const dynamic = "force-dynamic";
