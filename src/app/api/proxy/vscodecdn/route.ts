// src/app/api/proxy/vscodecdn/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: { path?: string[] } }
) {
  try {
    const { path } = context.params;
    if (!path || path.length === 0) {
      return NextResponse.json({ error: "Missing path" }, { status: 400 });
    }

    const targetUrl = `https://main.vscode-cdn.net/${path.join("/")}`;
    const res = await fetch(targetUrl);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch ${targetUrl}` },
        { status: res.status }
      );
    }

    const contentType =
      res.headers.get("content-type") || "application/octet-stream";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err: unknown) {
    console.error("Proxy error:", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
