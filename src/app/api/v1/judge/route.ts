import { z } from "zod";
import { parseJson, validationError } from "@/lib/api";
import { rateLimit } from "@/lib/server/rate-limit";
import { evaluateDeliverableWithAi } from "@/lib/server/ai-evaluator";
import { handlePaidRequest } from "@/lib/x402";

// AI Judge as a Service — paid, stateless deliverable evaluation for external
// agents. Unrelated to any job record: nothing is written to the database.
const judgeSchema = z.object({
  title: z.string().trim().min(1).max(200),
  brief: z.string().trim().min(1).max(6000),
  acceptanceCriteria: z.string().trim().min(1).max(4000),
  deliverableFormat: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
  deliverable: z.object({
    notes: z.string().max(6000).optional(),
    url: z.string().url().max(2000).optional(),
    fileName: z.string().max(255).optional(),
    mimeType: z.string().max(120).optional(),
    sha256: z.string().min(1).max(128).optional(),
    payload: z.record(z.string(), z.unknown()).optional(),
  }),
});

export async function POST(request: Request) {
  const parsed = await parseJson(request, judgeSchema);
  if (!parsed.success) return validationError(parsed.error);

  const limited = await rateLimit(request, { key: "x402:judge", limit: 30, windowSeconds: 60 });
  if (limited) return limited;

  const input = parsed.data;
  return handlePaidRequest(request, "/api/v1/judge", async () => {
    const evaluation = await evaluateDeliverableWithAi(
      {
        title: input.title,
        brief: input.brief,
        acceptanceCriteria: input.acceptanceCriteria,
        deliverableFormat: input.deliverableFormat ?? null,
        category: input.category ?? null,
        tags: input.tags ?? [],
      },
      {
        notes: input.deliverable.notes ?? null,
        deliverableUrl: input.deliverable.url ?? null,
        deliverableFileName: input.deliverable.fileName,
        deliverableMimeType: input.deliverable.mimeType,
        deliverableSha256: input.deliverable.sha256,
        deliverablePayload: input.deliverable.payload,
      },
    );

    return {
      evaluation: {
        model: evaluation.model,
        score: evaluation.score,
        verdict: evaluation.verdict,
        summary: evaluation.summary,
        rubric: evaluation.rubric,
      },
    };
  });
}
