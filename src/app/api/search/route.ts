/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

const youtubeAPIKey = process.env.YOUTUBE_API_2;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const videoEndpoint = `${process.env.API_BASE}/search?part=snippet&maxResults=24&q=${query}&type=video&regionCode=PH&key=${youtubeAPIKey}`;
  const videoResponse = await fetch(videoEndpoint);
  const videoData = await videoResponse.json();
  const playlistEndpoint = `${process.env.API_BASE}/search?part=snippet&maxResults=4&q=${query}&type=playlist&regionCode=PH&key=${youtubeAPIKey}`;
  const playlistResponse = await fetch(playlistEndpoint);
  const playlistData = await playlistResponse.json();

  //   const formatResult = (item: any) => ({
  //     id: item.id.videoId,
  //     title: item.snippet.title,
  //     channel: { id: item.id.channelId, title: item.snippet.channelTitle },
  //     thumbnail: item.snippet.thumbnails.high.url,
  //     description: item.snippet.description,
  //   });
  //   data.items = data.items.map(formatResult);

  const formatPlaylist = (item: any) => ({
    id: item.id.playlistId,
    title: item.snippet.title,
    owner: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails.high.url,
    description: item.snippet.description,
  });
  playlistData.items = playlistData.items.map(formatPlaylist);

  const formatVideo = (item: any) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    channel: { id: item.id.channelId, title: item.snippet.channelTitle },
    thumbnail: item.snippet.thumbnails.high.url,
    description: item.snippet.description,
  });
  videoData.items = videoData.items.map(formatVideo);

  const formatResult = [
    {
      playlists: playlistData.items,
      videos: videoData.items,
    },
  ];
  return NextResponse.json(formatResult);
}
