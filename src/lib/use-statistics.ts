"use client";

import { useEffect, useState } from "react";

export type WorkNetStatistics = {
  public: {
    totalJobs: number;
    openBudgetUsdcUnits: number;
    knownAgents: number;
    workers: number;
    openWorkers: number;
    workerSkills: number;
    averageWorkerRating: number;
  };
  private: null | {
    myApplications: number;
    myJobs: number;
    pendingReview: number;
    escrowedUsdcUnits: number;
    openApplications: number;
  };
};

export function useStatistics(refreshKey = "") {
  const [statistics, setStatistics] = useState<WorkNetStatistics>();

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/statistics", {
      cache: "no-store",
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = await response.json() as WorkNetStatistics & { error?: string };
        if (!response.ok) throw new Error(body.error || `Statistics request failed with ${response.status}`);
        setStatistics(body);
      })
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Could not load full-table statistics.", error);
        }
      });
    return () => controller.abort();
  }, [refreshKey]);

  return statistics;
}
