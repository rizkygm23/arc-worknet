import type { Job, Profile } from "./types";

export type RecommendedJob = {
  job: Job;
  score: number;
  matchedSkills: string[];
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function recommendJobs(
  jobs: Job[],
  profile: Profile,
  limit = 5,
): RecommendedJob[] {
  if (!profile) return [];
  const skills = profile.skills.map(normalize).filter(Boolean);
  if (skills.length === 0) return [];

  const open = jobs.filter((job) => job.status === "open");
  if (open.length === 0) return [];

  const ranked = open
    .map<RecommendedJob>((job) => {
      const haystack = [job.category, ...job.tags].map(normalize);
      const matched = profile.skills.filter((skill) => haystack.includes(normalize(skill)));
      const titleHaystack = normalize([job.title, job.brief].join(" "));
      const titleMatches = profile.skills.filter((skill) =>
        titleHaystack.includes(normalize(skill)),
      );
      const score = matched.length * 2 + titleMatches.length;
      const unique = Array.from(new Set([...matched, ...titleMatches]));
      return { job, score, matchedSkills: unique };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.job.budgetUsdcUnits - a.job.budgetUsdcUnits)
    .slice(0, limit);

  return ranked;
}
