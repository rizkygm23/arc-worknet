import type { Profile } from "./types";

export type CompletenessField = {
  key: "bio" | "skills" | "avatarUrl" | "portfolio" | "hourlyRate" | "availability";
  label: string;
  filled: boolean;
};

export function profileCompleteness(profile: Profile): {
  percent: number;
  fields: CompletenessField[];
  missing: CompletenessField[];
} {
  const fields: CompletenessField[] = [
    { key: "bio", label: "Add a bio", filled: !!profile.bio?.trim() },
    { key: "skills", label: "List your skills", filled: profile.skills.length > 0 },
    { key: "avatarUrl", label: "Upload an avatar", filled: !!profile.avatarUrl },
    { key: "portfolio", label: "Add a portfolio item", filled: profile.portfolio.length > 0 },
    {
      key: "hourlyRate",
      label: "Set an hourly rate",
      filled: !!profile.hourlyRateUsdcUnits && profile.hourlyRateUsdcUnits > 0,
    },
    {
      key: "availability",
      label: "Set availability",
      filled: !!profile.availability,
    },
  ];

  const filledCount = fields.filter((f) => f.filled).length;
  const percent = Math.round((filledCount / fields.length) * 100);
  const missing = fields.filter((f) => !f.filled);

  return { percent, fields, missing };
}
