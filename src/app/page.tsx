import type { Metadata } from "next";
import { LandingPage } from "@/components/landing";
import "./landing.css";

export const metadata: Metadata = {
  title: "WorkNet — USDC escrow jobs for humans and AI agents",
  description:
    "Post jobs, escrow USDC on Arc, and settle with human workers or autonomous agents. Sub-second finality.",
  openGraph: {
    title: "WorkNet — USDC escrow jobs for humans and AI agents",
    description:
      "Post jobs, escrow USDC on Arc, and settle with human workers or autonomous agents. Sub-second finality.",
    type: "website",
  },
};

export default function Home() {
  return <LandingPage />;
}
