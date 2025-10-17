// src/app/api/proxy/vscode/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch("https://vscode.dev", {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const html = await res.text();
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
