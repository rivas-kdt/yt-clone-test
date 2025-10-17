// src/app/api/proxy/vscode/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const url =
    "https://main.vscode-cdn.net/stable/7d842fb85a0275a4a8e4d7e040d2625abbf7f084/out/vs/workbench/workbench.web.main.internal.js";
  const res = await fetch(url);
  const text = await res.text();

  const response = new NextResponse(text, {
    headers: {
      "Content-Type": "application/javascript",
      "Access-Control-Allow-Origin": "*", // ✅ add CORS
      "Cache-Control": "public, max-age=86400",
    },
  });
  return response;
}
