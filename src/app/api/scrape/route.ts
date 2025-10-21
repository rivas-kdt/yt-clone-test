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

async function getFirstVideoFromPlaylist(playlistId: string) {
  try {
    const res = await fetch(
      `https://www.youtube.com/playlist?list=${playlistId}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        },
      }
    );
    const html = await res.text();

    const ytInitialDataRegex = /var ytInitialData = ([\s\S]*?);<\/script>/;
    const match = html.match(ytInitialDataRegex);
    if (!match || !match[1]) return null;

    const data = JSON.parse(match[1]);

    const playlistData =
      data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer
        ?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer
        ?.contents?.[0]?.playlistVideoListRenderer;

    const firstItem = playlistData?.contents?.find(
      (x: any) => x.playlistVideoRenderer
    )?.playlistVideoRenderer;

    if (!firstItem) return null;

    const firstVideoId = firstItem.videoId;
    const thumbnail =
      firstItem.thumbnail?.thumbnails?.[
        firstItem.thumbnail.thumbnails.length - 1
      ]?.url;
    const title =
      firstItem.title?.runs?.[0]?.text ||
      firstItem.title?.simpleText ||
      "Unknown video";

    return { firstVideoId, thumbnail, title };
  } catch (err) {
    console.error("Failed to fetch playlist data:", err);
    return null;
  }
}

async function getFirstVideoFromPlaylist2(playlistId: string, videoId: string) {
  try {
    const isMix = playlistId.startsWith("RD");

    // Mixes (RD...) require /watch endpoint
    const url = isMix
      ? `https://www.youtube.com/watch?v=${videoId}&list=${playlistId}`
      : `https://www.youtube.com/playlist?list=${playlistId}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
    });

    const html = await res.text();
    const match = html.match(/var ytInitialData = ([\s\S]*?);<\/script>/);
    if (!match) return null;

    const data = JSON.parse(match[1]);

    // Try normal playlist structure first
    let firstVideo =
      data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents?.find(
        (x: any) => x.playlistVideoRenderer
      )?.playlistVideoRenderer;

    // If not found, fallback to mix structure (playlistPanelVideoRenderer)
    if (!firstVideo) {
      firstVideo =
        data?.contents?.twoColumnWatchNextResults?.playlist?.playlist?.contents?.find(
          (x: any) => x.playlistPanelVideoRenderer
        )?.playlistPanelVideoRenderer;
    }

    if (!firstVideo) return null;

    const firstVideoId = firstVideo.videoId;
    const thumbnails = firstVideo.thumbnail?.thumbnails || [];
    const thumbnail =
      thumbnails.length > 0
        ? thumbnails[thumbnails.length - 1].url
        : `https://i.ytimg.com/vi/${firstVideoId}/hqdefault.jpg`; // fallback

    const title =
      firstVideo.title?.runs?.[0]?.text ||
      firstVideo.title?.simpleText ||
      "Unknown video";

    return { firstVideoId, thumbnail, title };
  } catch (err) {
    console.error("Failed to fetch playlist data:", err);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("v");
    const videoUrl =
      searchParams.get("url") || `https://www.youtube.com/watch?v=${videoId}`;

    const html = await scrap(videoUrl);

    const ytInitialDataRegex = /var ytInitialData = ([\s\S]*?);<\/script>/;
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

    const videos = results
      .map((item: any) => {
        const video = item.compactVideoRenderer || item.lockupViewModel;
        if (video) {
          const contentId = video.videoId || video.contentId;
          if (!contentId) return null;

          const title =
            video.title?.simpleText ||
            video.title?.runs?.[0]?.text ||
            video.metadata?.lockupMetadataViewModel?.title?.content ||
            null;

          const thumbnail =
            video.thumbnail?.thumbnails?.[0]?.url ||
            video.contentImage?.thumbnailViewModel?.image?.sources?.[0]?.url ||
            null;

          const duration =
            video.lengthText?.simpleText ||
            video.contentImage?.thumbnailViewModel?.overlays?.[0]
              ?.thumbnailOverlayBadgeViewModel?.thumbnailBadges?.[0]
              ?.thumbnailBadgeViewModel?.text ||
            null;

          const metadataRows =
            video.metadata?.lockupMetadataViewModel?.metadata
              ?.contentMetadataViewModel?.metadataRows || [];

          let channelTitle = null;
          let views = null;
          let publishedAt = null;

          if (metadataRows.length >= 2) {
            channelTitle =
              metadataRows[0]?.metadataParts?.[0]?.text?.content || null;
            const parts = metadataRows[1]?.metadataParts || [];
            views = parts[0]?.text?.content || null;
            publishedAt = parts[1]?.text?.content || null;
          }

          const channelId =
            video.longBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint
              ?.browseId ||
            video.metadata?.lockupMetadataViewModel?.image
              ?.decoratedAvatarViewModel?.rendererContext?.commandContext?.onTap
              ?.innertubeCommand?.browseEndpoint?.browseId ||
            null;

          const isPlaylist =
            typeof contentId === "string" &&
            (contentId.startsWith("PL") || contentId.startsWith("RD"));

          if (isPlaylist) {
            const isMix = contentId.startsWith("RD");

            return {
              type: isMix ? "mix" : "playlist",
              id: contentId,
              title,
              thumbnail: null,
              channel: { id: channelId, title: channelTitle },
              views: isMix ? "Auto-generated Mix" : "View full playlist",
              publishedAt: null,
              url: isMix
                ? `/w?v=${videoId || contentId}&list=${contentId}`
                : `/playlist?list=${contentId}`,
            };
          }

          return {
            type: "video",
            id: contentId,
            title,
            thumbnail,
            duration,
            channel: { id: channelId, title: channelTitle },
            views,
            publishedAt,
            url: `/w?v=${contentId}`,
          };
        }

        const playlist = item.compactPlaylistRenderer;
        if (playlist) {
          const playlistId = playlist.playlistId;
          const title = playlist.title?.simpleText || null;
          const channelTitle = playlist.longBylineText?.runs?.[0]?.text || null;
          const channelId =
            playlist.longBylineText?.runs?.[0]?.navigationEndpoint
              ?.browseEndpoint?.browseId || null;
          const videoCount =
            playlist.videoCountShortText?.simpleText ||
            playlist.videoCount?.toString() ||
            null;

          return {
            type: "playlist",
            id: playlistId,
            title,
            thumbnail: null,
            channel: { id: channelId, title: channelTitle },
            views: `${videoCount || "View full playlist"}`,
            publishedAt: null,
            url: `/playlist?list=${playlistId}`,
          };
        }

        return null;
      })
      .filter(Boolean);

    // 4️⃣ Enrich playlist items with real first video data
    await Promise.all(
      videos.map(async (vid: any) => {
        if (vid.type === "playlist" || vid.type === "mix") {
          const info = await getFirstVideoFromPlaylist2(vid.id, videoId || "");
          if (info) {
            vid.thumbnail = info.thumbnail;
            vid.url = `/w?v=${info.firstVideoId}&list=${vid.id}`;
          }
        }
      })
    );

    // 5️⃣ Return clean JSON
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
