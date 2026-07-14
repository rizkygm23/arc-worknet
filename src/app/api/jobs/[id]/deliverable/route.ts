import { NextResponse } from "next/server";
import sharp from "sharp";
import { getServiceClientOrResponse } from "@/lib/api";
import { decryptJson } from "@/lib/server/encryption";
import { requireWalletSession } from "@/lib/server/wallet-session";
import { TABLES } from "@/lib/supabase/tables";

const DELIVERABLES_BUCKET = "deliverables";
const SIGNED_URL_TTL_SECONDS = 60;

type RouteContext = {
  params: Promise<{ id: string }>;
};

type FileMeta = {
  mimeType?: string;
  fileName?: string;
  sizeBytes?: number;
};

function jsonRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

// Builds an SVG watermark overlay tiled across the image and composites it on top.
async function watermarkImage(bytes: Buffer, label: string): Promise<Buffer> {
  const image = sharp(bytes, { failOn: "none" });
  const meta = await image.metadata();
  const width = Math.min(meta.width ?? 1200, 1600);
  // Downscale slightly so the preview is not a pristine original.
  const resized = image.resize({ width, withoutEnlargement: true });
  const resizedMeta = await resized.clone().metadata();
  const w = resizedMeta.width ?? width;
  const h = resizedMeta.height ?? Math.round(width * 0.66);
  const fontSize = Math.max(18, Math.round(w / 22));
  const safeLabel = label.replace(/[<>&]/g, "");
  const tiles: string[] = [];
  for (let y = fontSize * 2; y < h; y += fontSize * 6) {
    for (let x = -w; x < w * 1.5; x += fontSize * 18) {
      tiles.push(
        `<text x="${x}" y="${y}" font-family="sans-serif" font-size="${fontSize}" ` +
          `fill="rgba(255,255,255,0.30)" transform="rotate(-30 ${x} ${y})">${safeLabel}</text>`,
      );
    }
  }
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${tiles.join("")}</svg>`;
  return resized
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 70 })
    .toBuffer();
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;
  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;

  const url = new URL(request.url);
  const submissionId = url.searchParams.get("submissionId");
  const mode = url.searchParams.get("mode") === "download" ? "download" : "preview";
  if (!submissionId) {
    return NextResponse.json({ error: "submissionId is required." }, { status: 400 });
  }

  const { data: job, error: jobError } = await supabase
    .from(TABLES.jobs)
    .select("id,arc_job_id,client_profile_id,provider_profile_id,provider_agent_id,status")
    .eq("id", id)
    .single();
  if (jobError) return NextResponse.json({ error: jobError.message }, { status: 404 });

  // Resolve participation: client, provider profile, or provider-agent owner.
  const isClient = job.client_profile_id === session.profileId;
  let isProvider = job.provider_profile_id === session.profileId;
  if (!isProvider && job.provider_agent_id) {
    const { data: agent } = await supabase
      .from(TABLES.agents)
      .select("owner_profile_id")
      .eq("id", job.provider_agent_id)
      .single();
    isProvider = agent?.owner_profile_id === session.profileId;
  }
  if (!isClient && !isProvider) {
    return NextResponse.json({ error: "Not a participant on this job." }, { status: 403 });
  }

  const { data: submission, error: subError } = await supabase
    .from(TABLES.submissions)
    .select("id,deliverable_storage_path,deliverable_payload,deliverable_sha256,status")
    .eq("id", submissionId)
    .eq("job_id", id)
    .single();
  if (subError) return NextResponse.json({ error: subError.message }, { status: 404 });
  if (!submission.deliverable_storage_path) {
    return NextResponse.json({ error: "No uploaded file for this submission." }, { status: 404 });
  }

  const rawPath = submission.deliverable_storage_path;
  const storagePath = rawPath.startsWith("deliverables/") ? rawPath.slice("deliverables/".length) : rawPath;

  const payload = decryptJson(jsonRecord(submission.deliverable_payload));
  const meta = (payload?.fileMeta ?? {}) as FileMeta;
  const mimeType = meta.mimeType ?? "application/octet-stream";
  const isImage = mimeType.startsWith("image/");
  const isApproved = submission.status === "approved" || job.status === "completed";

  // ---- DOWNLOAD ----
  // Worker can always fetch their own work. Client only after approval.
  if (mode === "download") {
    if (!isProvider && !isApproved) {
      return NextResponse.json(
        { error: "You can download the file only after you approve the work." },
        { status: 403 },
      );
    }
    const { data: signed, error: signError } = await supabase.storage
      .from(DELIVERABLES_BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS, {
        download: meta.fileName ?? true,
      });
    if (signError || !signed) {
      return NextResponse.json(
        { error: `Could not create download URL: ${signError?.message ?? "unknown"}` },
        { status: 502 },
      );
    }
    return NextResponse.json({ url: signed.signedUrl, fileName: meta.fileName, mimeType });
  }

  // ---- PREVIEW (pre-approval) ----
  // Worker viewing their own file gets the original; the client gets a locked
  // preview: watermarked image, or metadata-only for non-images.
  if (isProvider || isApproved) {
    const { data: signed } = await supabase.storage
      .from(DELIVERABLES_BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
    if (signed) {
      return NextResponse.json({ url: signed.signedUrl, mimeType, locked: false });
    }
  }

  if (!isImage) {
    // Non-image, not approved: metadata only — never the bytes.
    return NextResponse.json({
      locked: true,
      mimeType,
      fileName: meta.fileName,
      sizeBytes: meta.sizeBytes,
      sha256: submission.deliverable_sha256,
    });
  }

  // Image, not approved: stream a watermarked, downscaled JPEG.
  const { data: fileBlob, error: dlError } = await supabase.storage
    .from(DELIVERABLES_BUCKET)
    .download(storagePath);
  if (dlError || !fileBlob) {
    return NextResponse.json(
      { error: `Could not read file: ${dlError?.message ?? "unknown"}` },
      { status: 502 },
    );
  }

  const clientProfile = job.client_profile_id
    ? (
        await supabase
          .from(TABLES.profiles)
          .select("display_name")
          .eq("id", job.client_profile_id)
          .single()
      ).data
    : null;
  const label = `ArcWorkNet PREVIEW · ${clientProfile?.display_name ?? "client"} · job ${job.arc_job_id ?? id}`;

  const inputBuffer = Buffer.from(await fileBlob.arrayBuffer());
  let out: Buffer;
  try {
    out = await watermarkImage(inputBuffer, label);
  } catch {
    return NextResponse.json({ error: "Could not render preview." }, { status: 500 });
  }

  return new NextResponse(new Uint8Array(out), {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
