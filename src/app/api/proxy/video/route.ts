// /api/proxy/video?url=<encoded-video-url>
import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoUrl = searchParams.get("url");
  if (!videoUrl) return NextResponse.json({ error: "Missing URL" }, { status: 400 });

  try {
    const res = await axios.get(videoUrl, {
      responseType: "stream",
      headers: {
        referer: "https://9animetv.to/",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      },
    });

    const headers = new Headers();
    res.headers &&
      Object.entries(res.headers).forEach(([key, value]) => {
        if (typeof value === "string") headers.set(key, value);
      });

    return new Response(res.data, { headers });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch video" }, { status: 500 });
  }
}
