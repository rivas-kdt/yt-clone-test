/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import YouTube from "react-youtube";

export default function WatchPage() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get("v");
  const [size, setSize] = useState("max-w-[350px]");

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

  console.log("Size:", size);

  return (
    <div
      className={`
            flex flex-col  p-4  h-[calc(100vh-72px)] bg-[url(/images/bg.png)] ${
              isCentered
                ? "items-center justify-center"
                : "items-end justify-end"
            }`}
    >
      <div className=" flex gap-2 mb-4">
        <button
          className=" bg-[#989898] rounded-sm px-2 aspect-square hover:bg-white"
          onClick={() => handleChangeSize("s")}
        >
          S
        </button>
        <button
          className=" bg-[#989898] rounded-sm px-2 aspect-square hover:bg-white"
          onClick={() => handleChangeSize("m")}
        >
          M
        </button>
        <button
          className=" bg-[#989898] rounded-sm px-2 aspect-square hover:bg-white"
          onClick={() => handleChangeSize("l")}
        >
          L
        </button>
        <button
          className=" bg-[#989898] rounded-sm px-2 aspect-square hover:bg-white"
          onClick={() => handleChangeSize("t")}
        >
          T
        </button>
      </div>
      <div
        className={`relative w-full ${size}`}
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
