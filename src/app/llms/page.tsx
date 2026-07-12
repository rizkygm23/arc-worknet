import { promises as fs } from "fs";
import path from "path";
import Link from "next/link";
import { Download, ArrowLeft } from "lucide-react";
import ClientDownloader from "./ClientDownloader";

export default async function LLMsPage() {
  let content = "";
  try {
    const filePath = path.join(process.cwd(), "llms.md");
    content = await fs.readFile(filePath, "utf8");
  } catch {
    content = "Error: llms.md file not found at project root.";
  }

  return (
    <div style={{ background: "#0c0a0f", color: "#e2e8f0", minHeight: "100vh", fontFamily: "var(--font-mono)", fontSize: "13px", lineHeight: "1.6" }}>
      {/* Sticky Header bar */}
      <div style={{
        position: "sticky",
        top: 0,
        background: "rgba(12, 10, 15, 0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--hairline)",
        padding: "12px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontWeight: 700, color: "var(--accent-lime)", letterSpacing: "-0.01em" }}>llms.md</span>
          <span style={{ color: "var(--muted)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Arc WorkNet Agent Runbook</span>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <a href="/api/llms" download="llms.md" className="button primary small" style={{ display: "flex", alignItems: "center", gap: "6px", textDecoration: "none" }}>
            <Download size={13} /> Download
          </a>
          <Link href="/" className="button ghost small" style={{ display: "flex", alignItems: "center", gap: "6px", textDecoration: "none" }}>
            <ArrowLeft size={13} /> Back to Home
          </Link>
        </div>
      </div>

      {/* Raw Markdown Render */}
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 24px" }}>
        <pre style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          margin: 0,
          fontFamily: "var(--font-mono)",
          color: "#f1f5f9",
          background: "transparent",
          padding: 0,
          border: 0,
        }}>
          {content}
        </pre>
      </div>

      {/* Trigger download on client */}
      <ClientDownloader />
    </div>
  );
}
