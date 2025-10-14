/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const listId = searchParams.get("list");
  if (!listId) return NextResponse.json({ success: false });

  const res = await fetch(`https://www.youtube.com/playlist?list=${listId}`);
  const html = await res.text();
  const match = html.match(/var ytInitialData = ([\s\S]*?);<\/script>/);
  if (!match) return NextResponse.json({ success: false });

  const data = JSON.parse(match[1]);

  const playlistData =
    data.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer
      ?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer
      ?.contents?.[0]?.playlistVideoListRenderer;

  const videos =
    playlistData?.contents
      ?.map((x: any) => {
        const v = x.playlistVideoRenderer;
        if (!v) return null;
        return {
          id: v.videoId,
          title: v.title?.runs?.[0]?.text,
          thumbnail: v.thumbnail?.thumbnails?.[0]?.url,
          duration: v.lengthText?.simpleText,
          channel: { title: v.shortBylineText?.runs?.[0]?.text },
        };
      })
      .filter(Boolean) || [];

  const title = data.metadata?.playlistMetadataRenderer?.title || "Playlist";
  const channel =
    playlistData?.ownerName?.runs?.[0]?.text ||
    playlistData?.titleText?.runs?.[0]?.text ||
    "";
  const total = `${playlistData?.contents?.length || videos.length} / ${
    playlistData?.totalVideos || videos.length
  }`;

  return NextResponse.json({ success: true, title, channel, total, videos });
}
