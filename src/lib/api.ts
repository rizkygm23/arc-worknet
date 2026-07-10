import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { env, hasSupabaseServiceConfig } from "./env";
import { createSupabaseServiceClient } from "./supabase/server";

export const txHashSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/);

export const createJobSchema = z.object({
  clientProfileId: z.string().uuid(),
  title: z.string().trim().min(3, "Title must be at least 3 characters.").max(160),
  brief: z.string().trim().min(1, "Brief is required."),
  acceptanceCriteria: z.string().trim().min(1, "Acceptance criteria is required."),
  deliverableFormat: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  tags: z.array(z.string().min(1).max(40)).default([]),
  budgetUsdcUnits: z.number().int().positive(),
  deadlineAt: z.string().datetime().optional(),
  actorType: z.enum(["human", "agent"]).default("human"),
  descriptionHash: txHashSchema.optional(),
  taskFilePath: z.string().min(1).optional(),
  taskFileName: z.string().min(1).optional(),
});

export const applySchema = z.object({
  applicantProfileId: z.string().uuid().optional(),
  applicantAgentId: z.string().uuid().optional(),
  actorType: z.enum(["human", "agent"]),
  pitch: z.string().min(10),
  proposedBudgetUsdcUnits: z.number().int().positive().optional(),
  proposedDeadlineAt: z.string().datetime().optional(),
});

export const acceptApplicationSchema = z.object({
  applicationId: z.string().uuid(),
});

export const updateTxSchema = z.object({
  txHash: txHashSchema,
  arcJobId: z.string().optional(),
  blockNumber: z.number().int().optional(),
});

export const submitSchema = z.object({
  submitterProfileId: z.string().uuid().optional(),
  submitterAgentId: z.string().uuid().optional(),
  notes: z.string().optional(),
  deliverableUrl: z.string().url().optional(),
  deliverablePayload: z.record(z.string(), z.unknown()),
  deliverableHashBytes32: txHashSchema,
  submitTxHash: txHashSchema,
  blockNumber: z.number().int().optional(),
  // Uploaded-file deliverable (locked until approval). Optional so an external
  // link-only submission still validates.
  deliverableStoragePath: z.string().min(1).optional(),
  deliverableSha256: z.string().min(1).optional(),
  deliverableMimeType: z.string().min(1).optional(),
  deliverableFileName: z.string().min(1).optional(),
  deliverableSizeBytes: z.number().int().min(0).optional(),
});

export const uploadUrlSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(255),
});

export const reviewSchema = z.object({
  reviewerProfileId: z.string().uuid(),
  submissionId: z.string().uuid(),
  rating: z.number().int().min(1).max(5).optional(),
  reviewText: z.string().min(3),
  reasonHashBytes32: txHashSchema,
  completeTxHash: txHashSchema.optional(),
  reviewTxHash: txHashSchema,
  reviewTxMethod: z.enum(["complete", "requestRevision", "raiseDispute", "rejectWithPenalty"]),
  blockNumber: z.number().int().optional(),
  decision: z.enum(["approve", "request_revision", "reject"]),
});

export const rejectSchema = z.object({
  reviewerProfileId: z.string().uuid(),
  submissionId: z.string().uuid(),
  reasonText: z.string().min(3),
  reasonHashBytes32: txHashSchema,
  rejectTxHash: txHashSchema,
  blockNumber: z.number().int().optional(),
});

export async function parseJson<T>(request: Request, schema: z.ZodType<T>) {
  const json = await request.json().catch(() => undefined);
  return schema.safeParse(json);
}

export function productionUnavailable() {
  return NextResponse.json(
    {
      error: "Production backend is not configured.",
      requiredEnv: [
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
      ],
    },
    { status: 503 },
  );
}

function isAnonSupabaseJwt(key?: string) {
  const [, payload] = key?.split(".") ?? [];
  if (!payload) return false;

  try {
    const decoded = Buffer.from(payload.replaceAll("-", "+").replaceAll("_", "/"), "base64").toString("utf8");
    const claims = JSON.parse(decoded) as { role?: string };
    return claims.role === "anon";
  } catch {
    return false;
  }
}

export function invalidServiceRoleKey() {
  return NextResponse.json(
    {
      error:
        "SUPABASE_SERVICE_ROLE_KEY is not a service role key. Use the Supabase secret service_role key on the server, not the anon key.",
    },
    { status: 503 },
  );
}

export function validationError(error: z.ZodError) {
  return NextResponse.json({ error: "Invalid request body", details: error.flatten() }, { status: 400 });
}

export function getServiceClientOrResponse() {
  if (!hasSupabaseServiceConfig()) {
    return { response: productionUnavailable() };
  }

  if (isAnonSupabaseJwt(process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    return { response: invalidServiceRoleKey() };
  }

  return { supabase: createSupabaseServiceClient() };
}

function timingSafeSecretEquals(provided: string, expected: string) {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
}

function requestSecret(request: Request) {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }

  return request.headers.get("x-arc-worknet-secret")?.trim() ?? "";
}

function requireSecret(request: Request, expected: string | undefined, label: string) {
  if (!expected) {
    return NextResponse.json({ error: `${label} is not configured.` }, { status: 503 });
  }

  if (!timingSafeSecretEquals(requestSecret(request), expected)) {
    return NextResponse.json({ error: "Invalid endpoint secret." }, { status: 401 });
  }

  return undefined;
}

export function requireAdminSecret(request: Request) {
  return requireSecret(request, env.ADMIN_API_SECRET, "ADMIN_API_SECRET");
}

export function requireCircleWebhookSecret(request: Request) {
  return requireSecret(request, env.CIRCLE_WEBHOOK_SECRET, "CIRCLE_WEBHOOK_SECRET");
}
