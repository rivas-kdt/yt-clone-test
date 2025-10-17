/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import Link from "next/link";

function titleCleaner(title: string) {
  return title
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export default function Home() {
  const [loading, setLoading] = useState<boolean>(false);
  const [feedVideos, setFeedVideos] = useState<any[]>([]);
  const [feedPlaylists, setFeedPlaylists] = useState<any[]>([]);

  const getSearchHistory = (): string[] => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("searchHistory") || "[]");
    } catch {
      return [];
    }
  };

  useEffect(() => {
    const fetchLocalFeed = async () => {
      const history = getSearchHistory();
      if (history.length === 0) return;

      setLoading(true);
      try {
        const topTerms = history.slice(0, 3);
        const aggregatedVideos: any[] = [];
        const aggregatedPlaylists: any[] = [];

        for (const term of topTerms) {
          const res = await fetch(
            `/api/youtube/search?q=${encodeURIComponent(term)}`
          );
          const data = await res.json();
          console.log(
            `/api/youtube/search?q=${encodeURIComponent(term)}:`,
            data
          );

          if (data?.videos?.length || data?.playlists?.length) {
            aggregatedVideos.push(...(data.videos || []));
            aggregatedPlaylists.push(...(data.playlists || []));
          }
        }

        const uniqueVideos = Array.from(
          new Map(aggregatedVideos.map((v) => [v.id, v])).values()
        );
        const uniquePlaylists = Array.from(
          new Map(aggregatedPlaylists.map((p) => [p.id, p])).values()
        );

        const shuffle = <T,>(array: T[]): T[] =>
          array
            .map((a) => [Math.random(), a] as [number, T])
            .sort((a, b) => a[0] - b[0])
            .map((a) => a[1]);

        setFeedVideos(shuffle(uniqueVideos).slice());
        setFeedPlaylists(shuffle(uniquePlaylists).slice(0, 8));
      } catch (err) {
        console.error("Feed error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocalFeed();
  }, []);

  return (
    <main className="flex items-end p-12 pr-0 pb-0 flex-col bg-[url(/images/bg.png)]">
      {loading ? (
        <Skeleton className="w-full min-h-[calc(100vh-168px)]" />
      ) : (
        <div className="max-w-xl min-h-[calc(100vh-120px)] overflow-auto scrollbar-thin px-2">
          {feedVideos.length > 0 || feedPlaylists.length > 0 ? (
            <>
              <p className="font-bold text-2xl py-4">Recommended Videos</p>
              <div className="grid grid-cols-1 gap-4 mb-8">
                {feedVideos.map((video: any) => (
                  <Link
                    key={video.id}
                    href={`/w?v=${video.id}`}
                    className="flex gap-4 hover:bg-[#2b2b2b] rounded-lg p-2 transition"
                  >
                    <div className="relative">
                      <Image
                        src={video.thumbnail}
                        alt={video.title}
                        height={100}
                        width={180}
                        className="rounded-md aspect-video object-cover"
                      />
                      {video.duration && (
                        <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                          {video.duration}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col justify-between">
                      <div>
                        <p className="text-white font-semibold leading-snug">
                          {titleCleaner(video.title)}
                        </p>
                        <p className="text-sm text-gray-400">
                          {titleCleaner(video.channel.title)}
                        </p>
                      </div>
                      {video.publishedAt && (
                        <p className="text-xs text-gray-500">
                          Published: {video.publishedAt}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              <Separator />
              <p className="font-bold text-2xl pb-4">
                {/* Your Recommended Playlists */}
              </p>
              <div className="grid grid-cols-1 gap-4 mb-8">
                {feedPlaylists.map((playlist: any) => (
                  <div key={playlist.id}>
                    <Image
                      src={playlist.thumbnail}
                      alt={playlist.title}
                      width={150}
                      height={100}
                      className="rounded-md aspect-video"
                    />
                    <p className="font-semibold mt-2">
                      {titleCleaner(playlist.title)}
                    </p>
                    <p className="text-sm text-gray-400">
                      Playlist by {titleCleaner(playlist.owner || "Unknown")}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center mt-8 text-gray-400">
              Your feed is empty — try searching for topics to personalize it!
            </p>
          )}
        </div>
      )}
    </main>
  );
}
