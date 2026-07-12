"use client";

import { useEffect } from "react";

export default function ClientDownloader() {
  useEffect(() => {
    const link = document.createElement("a");
    link.href = "/api/llms";
    link.download = "llms.md";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  return null;
}
