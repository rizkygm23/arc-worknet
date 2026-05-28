import type { Agent, Profile } from "@/lib/types";

export type ReputationBadge = {
  id: "top-rated" | "expert" | "rising" | "verified" | "new" | "payment-verified" | "plus-client" | "repeat-client";
  label: string;
  description: string;
  tone: "ink" | "accent" | "success" | "warn";
};

const ONE_DAY_MS = 86_400_000;
const TEN_THOUSAND_USDC = 10_000_000_000; // 10,000 USDC in 6-decimal units

export function profileBadges(profile: Profile): ReputationBadge[] {
  const badges: ReputationBadge[] = [];

  if (profile.isVerified) {
    badges.push({
      id: "verified",
      label: "Verified",
      description: "Identity confirmed by Arc WorkNet.",
      tone: "ink",
    });
  }

  if (profile.role === "client") {
    if (profile.totalSpentUsdcUnits > 0) {
      badges.push({
        id: "payment-verified",
        label: "Payment verified",
        description: "Has funded at least one job escrow on Arc.",
        tone: "ink",
      });
    }
    if (profile.totalSpentUsdcUnits >= TEN_THOUSAND_USDC) {
      badges.push({
        id: "plus-client",
        label: "Plus client",
        description: "Spent $10,000+ in USDC across funded jobs.",
        tone: "accent",
      });
    }
    if (profile.completedJobsCount >= 3) {
      badges.push({
        id: "repeat-client",
        label: "Repeat client",
        description: "Completed 3+ funded jobs on Arc.",
        tone: "success",
      });
    }
  }

  if (profile.completedJobsCount >= 10 && profile.ratingAvg >= 4.8) {
    badges.push({
      id: "top-rated",
      label: "Top rated",
      description: "Consistent 4.8+ rating across 10+ paid jobs.",
      tone: "accent",
    });
  } else if (profile.completedJobsCount >= 25) {
    badges.push({
      id: "expert",
      label: "Expert",
      description: "Completed 25+ funded jobs on Arc.",
      tone: "accent",
    });
  }

  if (
    profile.completedJobsCount > 0 &&
    profile.completedJobsCount < 5 &&
    profile.ratingAvg >= 4.5
  ) {
    badges.push({
      id: "rising",
      label: "Rising talent",
      description: "Early track record with strong reviews.",
      tone: "success",
    });
  }

  const createdAt = Date.parse(profile.createdAt);
  if (
    profile.completedJobsCount === 0 &&
    Number.isFinite(createdAt) &&
    Date.now() - createdAt < 30 * ONE_DAY_MS
  ) {
    badges.push({
      id: "new",
      label: "New member",
      description: "Joined Arc WorkNet within the last 30 days.",
      tone: "warn",
    });
  }

  return badges;
}

export function agentBadges(agent: Agent): ReputationBadge[] {
  const badges: ReputationBadge[] = [];

  if (agent.arcAgentId) {
    badges.push({
      id: "verified",
      label: "On-chain ID",
      description: "Registered with the Arc agent identity registry.",
      tone: "ink",
    });
  }

  if (agent.jobsCompleted >= 10 && agent.reputationScore >= 90) {
    badges.push({
      id: "top-rated",
      label: "Top rated",
      description: "90+ reputation across 10+ completed jobs.",
      tone: "accent",
    });
  } else if (agent.jobsCompleted >= 25) {
    badges.push({
      id: "expert",
      label: "Expert",
      description: "25+ funded jobs delivered by this agent.",
      tone: "accent",
    });
  }

  if (
    agent.jobsCompleted > 0 &&
    agent.jobsCompleted < 5 &&
    agent.reputationScore >= 80
  ) {
    badges.push({
      id: "rising",
      label: "Rising talent",
      description: "Early run with strong reputation score.",
      tone: "success",
    });
  }

  return badges;
}
