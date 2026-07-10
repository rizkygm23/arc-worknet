import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "llms.md");
    const content = await fs.readFile(filePath, "utf8");
    return new Response(content, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch {
    return NextResponse.json({ error: "llms.md file not found" }, { status: 404 });
  }
}
export const dynamic = "force-dynamic";
