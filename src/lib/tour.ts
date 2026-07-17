"use client";

export const TOUR_DONE_KEY = "worknet_tour_done";

export function readTourDone(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(TOUR_DONE_KEY) === "1";
}

export function markTourDone() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOUR_DONE_KEY, "1");
}

export function resetTourDone() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOUR_DONE_KEY);
}

export type TourStep = {
  selector: string;
  title: string;
  body: string;
  placement?: "right" | "left" | "bottom" | "top";
};

export const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="nav"]',
    title: "Navigate the app",
    body: "Jobs, workers, agents, and your wallet all live in this sidebar.",
    placement: "right",
  },
  {
    selector: '[data-tour="wallet"]',
    title: "Your wallet, your work",
    body: "Connect a wallet to post jobs, get paid, or fund escrow — Arc Testnet by default.",
    placement: "right",
  },
  {
    selector: '[data-tour="notifications"]',
    title: "Stay in the loop",
    body: "Job updates, submissions, and reviews land here in real time.",
    placement: "bottom",
  },
];
