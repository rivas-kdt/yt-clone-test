/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

async function scrap(url: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    },
    redirect: "follow",
  });
  return res.text();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("v");
    const videoUrl =
      searchParams.get("url") || `https://www.youtube.com/watch?v=${videoId}`;

    // 2️⃣ Fetch HTML and extract ytInitialData
    const html = await scrap(videoUrl);
    const ytInitialDataRegex = /var ytInitialData = (.*?);<\/script>/s;
    const match = html.match(ytInitialDataRegex);

    if (!match || !match[1]) {
      return NextResponse.json({
        success: false,
        error: "No ytInitialData found",
      });
    }

    const data = JSON.parse(match[1]);
    const results =
      data.contents?.twoColumnWatchNextResults?.secondaryResults
        ?.secondaryResults?.results || [];

    // 3️⃣ Extract & normalize
    const videos = results
      .map((item: any) => {
        const model = item.lockupViewModel;
        if (!model) return null;

        const contentId = model.contentId;
        const title =
          model.metadata?.lockupMetadataViewModel?.title?.content || null;

        const channelAvatar =
          model.metadata?.lockupMetadataViewModel?.image
            ?.decoratedAvatarViewModel?.avatar?.avatarViewModel?.image
            ?.sources?.[0]?.url || null;

        const metadataRows =
          model.metadata?.lockupMetadataViewModel?.metadata
            ?.contentMetadataViewModel?.metadataRows || [];

        // Extract "channel", "views", "time"
        let channelTitle = null;
        let views = null;
        let timeAgo = null;

        if (metadataRows.length >= 2) {
          // Row 1: channel name
          channelTitle =
            metadataRows[0]?.metadataParts?.[0]?.text?.content || null;

          // Row 2: views + time
          const parts = metadataRows[1]?.metadataParts || [];
          views = parts[0]?.text?.content || null;
          timeAgo = parts[1]?.text?.content || null;
        }

        // Thumbnail + duration
        const thumbnail =
          model.contentImage?.thumbnailViewModel?.image?.sources?.[0]?.url ||
          null;

        const duration =
          model.contentImage?.thumbnailViewModel?.overlays?.[0]
            ?.thumbnailOverlayBadgeViewModel?.thumbnailBadges?.[0]
            ?.thumbnailBadgeViewModel?.text || null;

        // Channel ID
        const channelId =
          model.metadata?.lockupMetadataViewModel?.image
            ?.decoratedAvatarViewModel?.rendererContext?.commandContext?.onTap
            ?.innertubeCommand?.browseEndpoint?.browseId || null;

        return {
          id: contentId,
          title,
          thumbnail,
          duration,
          channel: {
            id: channelId,
            title: channelTitle,
            avatar: channelAvatar,
          },
          views,
          publishedAt: timeAgo,
        };
      })
      .filter(Boolean);

    // 4️⃣ Return clean response
    return NextResponse.json({
      success: true,
      count: videos.length,
      videos,
    });
  } catch (err: any) {
    console.error("Scrape error:", err);
    return NextResponse.json({ success: false, error: err.message });
  }
}
