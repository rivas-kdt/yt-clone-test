/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import YouTube from "react-youtube";
import Image from "next/image";
import Link from "next/link";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function WatchPage() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get("v");

  const [size, setSize] = useState("max-w-[350px]");
  const [relatedVideos, setRelatedVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const playerRef = useRef<any>(null);

  // ✅ YouTube Player Options
  const opts = {
    width: "100%",
    height: "100%",
    playerVars: {
      autoplay: 1,
      controls: 1,
      modestbranding: 1,
      rel: 0,
    },
  };

  const onReady = (event: any) => {
    playerRef.current = event.target;
  };

  // ✅ Fetch related videos from /api/scrape
  useEffect(() => {
    if (!videoId) return;

    const fetchRelatedVideos = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/scrape?v=${videoId}`);
        const data = await res.json();
        if (data.success && data.videos) {
          setRelatedVideos(data.videos);
        } else {
          setRelatedVideos([]);
        }
      } catch (err) {
        console.error("Failed to fetch related videos:", err);
        setRelatedVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedVideos();
  }, [videoId]);

  const handleChangeSize = (sizeKey: "s" | "m" | "l" | "t") => {
    const sizeMap: Record<string, string> = {
      s: "max-w-[300px]",
      m: "max-w-[350px]",
      l: "max-w-[500px]",
      t: "max-w-[75%]",
    };
    setSize(sizeMap[sizeKey]);
  };

  const isCentered = size === "max-w-[75%]";

  if (!videoId) {
    return (
      <main className="flex items-center justify-center h-screen text-gray-400">
        No video selected
      </main>
    );
  }

  return (
    <div
      className={`flex flex-col p-4 h-[calc(100vh-72px)] bg-[url(/images/bg.png)] ${
        isCentered ? "items-center justify-center" : "items-end justify-end"
      }`}
    >
      {/* 🔘 Player Size Controls */}
      <div className="flex gap-2 mb-4">
        {["s", "m", "l", "t"].map((key) => (
          <button
            key={key}
            className="bg-[#989898] rounded-sm px-2 aspect-square hover:bg-white"
            onClick={() => handleChangeSize(key as any)}
          >
            {key.toUpperCase()}
          </button>
        ))}
      </div>

      {/* 🎥 YouTube Player */}
      <div
        className={`relative w-full ${size}`}
        style={{ aspectRatio: "16 / 9" }}
      >
        <YouTube
          videoId={videoId}
          onReady={onReady}
          opts={opts}
          className="absolute inset-0 w-full h-full rounded-lg overflow-hidden"
        />
      </div>

      {/* 📜 Related Videos Sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <Button className="bg-[#989898] hover:bg-white text-black mt-4">
            R
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className=" scrollbar-thin bg-[#111]/90 backdrop-blur-md border-none text-white w-[380px] sm:w-[420px] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle className="text-lg font-bold text-white mb-2">
              Related Videos
            </SheetTitle>
          </SheetHeader>

          {loading ? (
            <div className="p-4 text-gray-400 text-center">
              Loading related videos...
            </div>
          ) : relatedVideos.length > 0 ? (
            <div className="p-2 flex flex-col gap-3 ">
              {relatedVideos.map((video) => (
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
                      <span className="absolute bottom-1 right-1 bg-black/80 text-xs px-1.5 py-0.5 rounded text-white">
                        {video.duration}
                      </span>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="flex flex-col text-sm flex-1">
                    <p className="font-semibold line-clamp-2">{video.title}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      {video.channel?.title}
                    </p>
                    <p className="text-gray-500 text-xs mt-auto">
                      {video.views} • {video.publishedAt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-4 text-gray-400 text-center">
              No related videos found
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
