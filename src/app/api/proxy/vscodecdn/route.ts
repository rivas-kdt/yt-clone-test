// src/app/api/proxy/vscodecdn/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const target = `https://main.vscode-cdn.net/${params.path.join("/")}`;
  const res = await fetch(target);

  const contentType =
    res.headers.get("content-type") || "application/octet-stream";
  const buffer = await res.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*", // ✅ enables script loading
      "Cache-Control": "public, max-age=86400",
    },
  });
}
