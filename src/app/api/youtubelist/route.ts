import { NextResponse } from "next/server";
import { getYotubeMusicList } from "@hydralerne/youtube-api";


export async function GET() {
  const radioId = "RDEMbQJjNtLQ6TooBiJUlg6Iiw";

  const res = await getYotubeMusicList(radioId);

  return NextResponse.json({ success: true, ...res });
}
