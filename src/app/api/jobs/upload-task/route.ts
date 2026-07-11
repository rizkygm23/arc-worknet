import { NextResponse } from "next/server";
import { getServiceClientOrResponse, parseJson, uploadUrlSchema, validationError } from "@/lib/api";
import { requireWalletSession } from "@/lib/server/wallet-session";
import { walletRateLimit } from "@/lib/server/rate-limit";

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200) || "file";
}

export async function POST(request: Request) {
  const parsed = await parseJson(request, uploadUrlSchema);
  if (!parsed.success) return validationError(parsed.error);

  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;

  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;

  const limited = await walletRateLimit(request, session.profileId, "jobs:upload-task");
  if (limited) return limited;

  try {
    const uuid = crypto.randomUUID();
    const sanitizedName = sanitizeFileName(parsed.data.fileName);
    const path = `tasks/${uuid}/${sanitizedName}`;

    const { data, error } = await supabase.storage
      .from("deliverables")
      .createSignedUploadUrl(path);

    if (error) {
      return NextResponse.json(
        { error: `Could not create upload URL: ${error.message}` },
        { status: 502 },
      );
    }

    return NextResponse.json({
      path,
      token: data.token,
      signedUrl: data.signedUrl,
      bucket: "deliverables",
      name: parsed.data.fileName,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
