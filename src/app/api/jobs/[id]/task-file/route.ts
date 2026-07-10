import { NextResponse } from "next/server";
import { getServiceClientOrResponse } from "@/lib/api";
import { TABLES } from "@/lib/supabase/tables";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;

  const { data: job, error: jobError } = await supabase
    .from(TABLES.jobs)
    .select("task_file_path,task_file_name")
    .eq("id", id)
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
