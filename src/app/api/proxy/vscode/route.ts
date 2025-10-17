// src/app/api/proxy/vscode/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const target = "https://vscode.dev";
  const res = await fetch(target, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  let html = await res.text();

  // 🔁 Replace all CDN references with your proxy path
  html = html.replace(
    /https:\/\/main\.vscode-cdn\.net\//g,
    "/api/proxy/vscodecdn/"
  );

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
