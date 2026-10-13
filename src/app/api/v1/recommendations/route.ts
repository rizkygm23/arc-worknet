import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJson, validationError } from "@/lib/api";
import { rateLimit } from "@/lib/server/rate-limit";
import { recommendJobs } from "@/lib/recommendations";
import { mapJob } from "@/lib/supabase/mappers";
import type { Profile } from "@/lib/types";
import { getServiceClientOrResponse } from "@/lib/api";
import { TABLES } from "@/lib/supabase/tables";
import { handlePaidRequest } from "@/lib/x402";

// Paid job recommendations for external agents: skill set in, ranked open
// jobs out. The matching logic is the same one the dashboard uses.
const recommendationsSchema = z.object({
  skills: z.array(z.string().trim().min(1).max(60)).min(1).max(30),
  limit: z.number().int().min(1).max(20).optional(),
});

export async function POST(request: Request) {
  const parsed = await parseJson(request, recommendationsSchema);
  if (!parsed.success) return validationError(parsed.error);

  const limited = await rateLimit(request, {
    key: "x402:recommendations",
    limit: 60,
    windowSeconds: 60,
  });
  if (limited) return limited;

  const input = parsed.data;
  return handlePaidRequest(request, "/api/v1/recommendations", async () => {
    const { supabase, response } = getServiceClientOrResponse();
    if (response) return response;

    const { data: rows, error } = await supabase
      .from(TABLES.jobs)
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) return NextResponse.json({ error: "Database request failed." }, { status: 500 });

    const jobs = (rows ?? []).map(mapJob);
    // recommendJobs only reads profile.skills.
    const pseudoProfile = { skills: input.skills } as unknown as Profile;
    const ranked = recommendJobs(jobs, pseudoProfile, input.limit ?? 10);

    return {
      recommendations: ranked.map((entry) => ({
        job: entry.job,
        score: entry.score,
        matchedSkills: entry.matchedSkills,
      })),
    };
  });
}
