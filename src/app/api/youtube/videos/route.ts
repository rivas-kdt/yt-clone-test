/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

const youtubeAPIKey = process.env.YOUTUBE_API_2;

// export async function GET(request: Request) {
export async function GET() {
  //   const { searchParams } = new URL(request.url);
  //   const query = searchParams.get("q");
  const videoEndpoint = `${process.env.API_BASE}/videos?part=contentDetails&chart=mostPopular&maxResults=20&key=${youtubeAPIKey}`;
  const videoResponse = await fetch(videoEndpoint);
  const videoData = await videoResponse.json();

  return NextResponse.json(videoData);
}
