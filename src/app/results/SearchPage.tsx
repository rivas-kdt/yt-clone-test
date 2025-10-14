/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");

  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (query) {
        setLoading(true);
        try {
          const res = await fetch(
            `/api/youtube/search?q=${encodeURIComponent(query)}`
          );
          const data = await res.json();
          setVideos(data.videos || []);
          console.log("Fetched videos:", data.videos);
        } catch (error) {
          console.error("Error fetching YouTube data:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchSearchResults();
  }, [query]);

  return (
    <div className="flex flex-col h-[calc(100vh-72px)] bg-[url(/images/bg.png)] items-center p-12 pb-0">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="w-full min-h-[calc(100vh-120px)] overflow-auto no-scrollbar">
          {query === "" ? (
            <p className="text-center mt-8 text-gray-400">
              Type something to search
            </p>
          ) : videos.length === 0 ? (
            <p className="text-center mt-8 text-gray-400">No results found</p>
          ) : (
            <>
              <div className="flex justify-end mb-8">
                <div className="flex flex-col gap-4 w-full max-w-2xl bg-[#353535]/40">
                  {videos.map((video: any) => (
                    <Link
                      key={video.id}
                      href={`/watch?v=${video.id}`}
                      className="flex gap-4 hover:bg-[#2b2b2b] rounded-lg p-2 transition"
                    >
                      {/* Thumbnail with duration overlay */}
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

                      {/* Video info */}
                      <div className="flex flex-col justify-between">
                        <div>
                          <p className="text-white font-semibold leading-snug">
                            {titleCleaner(video.title)}
                          </p>
                          <p className="text-sm text-gray-400">
                            {titleCleaner(video.channel.title)}
                          </p>
                        </div>

                        {/* Published date */}
                        {video.publishedAt && (
                          <p className="text-xs text-gray-500">
                            Published: {video.publishedAt}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
