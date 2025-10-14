/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import YouTube from "react-youtube";

export default function WatchPage() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get("v");

  // Player options — same as YouTube IFrame API options
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

  const playerRef = useRef<any>(null);

  const onReady = (event: any) => {
    playerRef.current = event.target;
  };

  useEffect(() => {
    if (playerRef.current && videoId) {
      playerRef.current.loadVideoById(videoId);
    }
  }, [videoId]);

  const onError = (error: any) => {
    console.error("YouTube Player Error:", error);
  };

  if (!videoId) {
    return (
      <main className="flex items-center justify-center h-screen text-gray-400">
        No video selected
      </main>
    );
  }

  return (
    <div className="flex flex-col items-end justify-end p-4 bg-[url(/images/bg.png)] h-[calc(100vh-72px)]">
      <div
        className="relative w-full max-w-[400px]"
        style={{ aspectRatio: "16 / 9" }}
      >
        <YouTube
          videoId={videoId}
          onReady={onReady}
          onError={onError}
          opts={opts}
          className="absolute inset-0 w-full h-full rounded-lg overflow-hidden"
        />
      </div>
    </div>
  );
}
