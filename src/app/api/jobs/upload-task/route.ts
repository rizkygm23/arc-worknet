import { NextResponse } from "next/server";
import { getServiceClientOrResponse } from "@/lib/api";
import { requireWalletSession } from "@/lib/server/wallet-session";
import { walletRateLimit } from "@/lib/server/rate-limit";

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200) || "file";
}

export async function POST(request: Request) {
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;

  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;

  const limited = await walletRateLimit(request, session.profileId, "jobs:upload-task");
  if (limited) return limited;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
    }

    const uuid = crypto.randomUUID();
    const sanitizedName = sanitizeFileName(file.name);
    const path = `tasks/${uuid}/${sanitizedName}`;

    // Convert File to ArrayBuffer and upload
    const buffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("deliverables")
      .upload(path, buffer, {
        contentType: file.type || "application/octet-stream",
      });

    if (uploadError) {
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 502 });
    }

    return NextResponse.json({ path, name: file.name });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
