/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

/** Simple fetch-based scraper **/
async function scrap(url: string, headers?: Record<string, string>) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      "Accept-Language": headers?.["Accept-Language"] || "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      ...headers,
    },
    redirect: "follow",
  });
  return res.text();
}

export async function POST(request: Request) {
  try {
    // Read user cookies from client
    const { cookies } = await request.json();
    const { searchParams } = new URL(request.url);
    const hl = searchParams.get("hl") || "en";
    const gl = searchParams.get("gl") || "US";

    // Use YouTube homepage localized to region/language
    const homepageUrl = `https://www.youtube.com/?hl=${hl}&gl=${gl}`;

    // Include user's real cookies if provided
    const headers: Record<string, string> = {};
    if (cookies) headers["Cookie"] = cookies;

    // 1️⃣ Fetch homepage HTML
    let html = await scrap(homepageUrl, headers);

    // 2️⃣ Extract ytInitialData
    const ytInitialDataRegex = /var ytInitialData = ([\s\S]*?);<\/script>/;
    const match = html.match(ytInitialDataRegex);
    if (!match || !match[1]) {
      return NextResponse.json({
        success: false,
        error: "No ytInitialData found",
      });
    }

    const data = JSON.parse(match[1]);

    // 3️⃣ Detect feed contents
    const contentRoot =
      data.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer
        ?.content;

    // If it's just a feedNudgeRenderer → fallback to explore feed
    if (contentRoot?.richGridRenderer?.contents?.[0]?.richSectionRenderer) {
      console.log("⚠️ No personalized feed found, switching to Explore...");
      html = await scrap("https://www.youtube.com/feed/explore", headers);
      const exploreMatch = html.match(ytInitialDataRegex);
      if (!exploreMatch || !exploreMatch[1])
        throw new Error("No explore feed data found");
      const exploreData = JSON.parse(exploreMatch[1]);
      return NextResponse.json(contentRoot);
    }

    // Otherwise, parse homepage normally
    return NextResponse.json({ contentRoot });
  } catch (err: any) {
    console.error("Homepage scrape error:", err);
    return NextResponse.json({ success: false, error: err.message });
  }
}

/** 🧩 Parse YouTube feed data */
async function parseFeed(data: any) {
  const contents =
    data.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer
      ?.content?.richGridRenderer?.contents || [];

  const videos = contents
    .map((item: any) => {
      const renderer = item.richItemRenderer?.content;
      if (!renderer) return null;

      // Normal video
      const video = renderer.videoRenderer;
      if (video) {
        const videoId = video.videoId;
        const title =
          video.title?.runs?.[0]?.text || video.title?.simpleText || "Untitled";
        const thumbnail =
          video.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        const channelTitle =
          video.ownerText?.runs?.[0]?.text ||
          video.longBylineText?.runs?.[0]?.text ||
          null;
        const channelId =
          video.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint
            ?.browseId ||
          video.longBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint
            ?.browseId ||
          null;
        const views =
          video.viewCountText?.simpleText ||
          video.shortViewCountText?.simpleText ||
          null;
        const publishedAt = video.publishedTimeText?.simpleText || null;
        const duration =
          video.lengthText?.simpleText ||
          video.thumbnailOverlays?.find(
            (o: any) => o.thumbnailOverlayTimeStatusRenderer
          )?.thumbnailOverlayTimeStatusRenderer?.text?.simpleText ||
          null;

        return {
          type: "video",
          id: videoId,
          title,
          thumbnail,
          duration,
          channel: { id: channelId, title: channelTitle },
          views,
          publishedAt,
          url: `/watch?v=${videoId}`,
        };
      }

      // Playlist / mix
      const mix = renderer.playlistRenderer;
      if (mix) {
        const playlistId = mix.playlistId;
        const firstVideoId =
          mix.navigationEndpoint?.watchEndpoint?.videoId || null;
        const title =
          mix.title?.simpleText ||
          mix.title?.runs?.[0]?.text ||
          "Playlist / Mix";
        const thumbnail =
          mix.thumbnails?.[0]?.thumbnails?.slice(-1)[0]?.url ||
          `https://i.ytimg.com/vi/${firstVideoId || ""}/hqdefault.jpg`;
        const videoCount = mix.videoCountText?.runs?.[0]?.text || "Playlist";

        return {
          type: "playlist",
          id: playlistId,
          title,
          thumbnail,
          channel: null,
          views: `${videoCount} videos`,
          publishedAt: null,
          url: firstVideoId
            ? `/watch?v=${firstVideoId}&list=${playlistId}`
            : `/playlist?list=${playlistId}`,
        };
      }

      return null;
    })
    .filter(Boolean);

  return { success: true, count: videos.length, videos };
}
