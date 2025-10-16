"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

type VideoSource = {
  link: string;
  server: string;
};

type ServerItem = {
  id: string;
  type: string;
  name: string;
  serverId: string;
};

type SourceResponse = {
  success: boolean;
  animeId: string;
  episodeId: string;
  selectedServer: ServerItem;
  video: VideoSource;
  allServers: ServerItem[];
  message?: string;
};

export default function AnimeWatchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  const ep = searchParams.get("ep") || "";

  const [source, setSource] = useState<SourceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState("max-w-[350px]");

  const iframeRef = useRef<HTMLIFrameElement>(null);

  /** 🎞 Fetch source and related anime */
  useEffect(() => {
    async function fetchSource() {
      setLoading(true);
      try {
        const url = `/api/9anime/source/${slug}?ep=${ep}`;
        const res = await fetch(url);
        const data = await res.json();
        setSource(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (slug && ep) fetchSource();
  }, [slug, ep]);

  /** 🎛 Resize player */
  const handleChangeSize = (key: "s" | "m" | "l" | "t") => {
    const map: Record<string, string> = {
      s: "max-w-[300px]",
      m: "max-w-[350px]",
      l: "max-w-[500px]",
      t: "max-w-[75%]",
    };
    setSize(map[key]);
  };

  const isCentered = size === "max-w-[75%]";

  if (loading)
    return (
      <main className="flex items-center justify-center h-screen text-gray-400">
        Loading...
      </main>
    );

  if (!source || !source.success)
    return (
      <main className="flex items-center justify-center h-screen text-gray-400">
        Error: {source?.message || "Could not load video source."}
      </main>
    );

  return (
    <div
      className={`flex flex-col p-4 h-[calc(100vh-72px)] bg-[url(/images/bg.png)] ${
        isCentered ? "items-center justify-center" : "items-end justify-end"
      }`}
    >
      {/* 🔘 Resize controls */}
      <div className="flex gap-2 mb-4">
        {["s", "m", "l", "t"].map((k) => (
          <button
            key={k}
            className="bg-[#989898] rounded-sm px-2 aspect-square hover:bg-white"
            onClick={() => handleChangeSize(k as "s" | "m" | "l" | "t")}
          >
            {k.toUpperCase()}
          </button>
        ))}
      </div>

      {/* 🎥 Anime Player */}
      <div
        className={`relative w-full ${size}`}
        style={{ aspectRatio: "16/9" }}
      >
        <iframe
          ref={iframeRef}
          src={source.video.link}
          title="Anime Episode"
          width="100%"
          height="100%"
          allowFullScreen
          className="absolute inset-0 w-full h-full rounded-lg overflow-hidden border-none"
        />
      </div>
    </div>
  );
}
