/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

const API_BASE =
  process.env.API_BASE || "https://www.googleapis.com/youtube/v3";

// Helper function: rotate through API keys
async function fetchWithYouTubeKeys(urlBuilder: (key: string) => string) {
  const keys = [
    process.env.YOUTUBE_API_1,
    process.env.YOUTUBE_API_2,
    process.env.YOUTUBE_API_3,
  ].filter(Boolean);

  let lastError: any = null;

  for (const key of keys) {
    try {
      const url = urlBuilder(key);
      const res = await fetch(url);
      const data = await res.json();

      if (!data.error) {
        return data; // ✅ success
      }

      const reason = data.error?.errors?.[0]?.reason;
      if (reason === "quotaExceeded" || reason === "dailyLimitExceeded") {
        console.warn(`YouTube quota exceeded for key: ${key}`);
        lastError = data.error;
        continue;
      }

      // Stop on non-quota error
      throw new Error(JSON.stringify(data.error));
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  throw new Error(
    `All YouTube API keys failed. Last error: ${JSON.stringify(lastError)}`
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  // 1️⃣ Search videos
  const searchData = await fetchWithYouTubeKeys(
    (key) =>
      `${API_BASE}/search?part=snippet&maxResults=24&q=${query}&type=video&regionCode=PH&key=${key}`
  );

  if (!searchData.items?.length) {
    return NextResponse.json({ videos: [] });
  }

  // 2️⃣ Extract video IDs
  const videoIds = searchData.items.map((i: any) => i.id.videoId).join(",");

  // 3️⃣ Get durations and details
  const detailsData = await fetchWithYouTubeKeys(
    (key) =>
      `${API_BASE}/videos?part=contentDetails,snippet&id=${videoIds}&key=${key}`
  );

  // 4️⃣ Build lookup table
  const videoDetails: Record<
    string,
    { duration: string; publishedAt: string }
  > = {};
  detailsData.items.forEach((vid: any) => {
    videoDetails[vid.id] = {
      duration: vid.contentDetails.duration,
      publishedAt: vid.snippet.publishedAt,
    };
  });

  // 5️⃣ Format functions
  const formatDuration = (iso: string) => {
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return "0:00";
    const hours = parseInt(match[1] || "0");
    const minutes = parseInt(match[2] || "0");
    const seconds = parseInt(match[3] || "0");
    const pad = (n: number) => n.toString().padStart(2, "0");
    return hours > 0
      ? `${hours}:${pad(minutes)}:${pad(seconds)}`
      : `${minutes}:${pad(seconds)}`;
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  // 6️⃣ Combine results
  const formatted = searchData.items.map((item: any) => {
    const details = videoDetails[item.id.videoId] || {};
    return {
      id: item.id.videoId,
      title: item.snippet.title,
      channel: {
        id: item.snippet.channelId,
        title: item.snippet.channelTitle,
      },
      thumbnail: item.snippet.thumbnails.high.url,
      description: item.snippet.description,
      duration: details.duration ? formatDuration(details.duration) : null,
      publishedAt: details.publishedAt ? formatDate(details.publishedAt) : null,
    };
  });

  return NextResponse.json({ videos: formatted });
}
