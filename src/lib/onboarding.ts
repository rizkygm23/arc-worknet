import type { Profile } from "./types";

export const ONBOARDING_DISMISSED_KEY = "arcworknet_onboarding_dismissed";

// "Needs onboarding" = brand-new profile that hasn't told us anything about
// what they do. We check bio + skills because those drive job matching.
export function needsOnboarding(profile: Profile): boolean {
  const hasBio = profile.bio.trim().length > 0;
  const hasSkills = profile.skills.length > 0;
  return !hasBio && !hasSkills;
}

export function readOnboardingDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ONBOARDING_DISMISSED_KEY) === "1";
}

export function dismissOnboarding() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ONBOARDING_DISMISSED_KEY, "1");
}

export function resetOnboardingDismissed() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ONBOARDING_DISMISSED_KEY);
}
