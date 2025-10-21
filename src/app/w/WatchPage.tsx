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
import { ListVideo } from "lucide-react";

export default function WatchPage() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get("v");
  const playlistId = searchParams.get("list");

  const [size, setSize] = useState("max-w-[350px]");
  const [relatedVideos, setRelatedVideos] = useState<any[]>([]);
  const [playlistVideos, setPlaylistVideos] = useState<any[]>([]);
  const [playlistTitle, setPlaylistTitle] = useState("");
  const [playlistInfo, setPlaylistInfo] = useState({ channel: "", total: "" });
  const [loading, setLoading] = useState(false);

  const playerRef = useRef<any>(null);

  const opts = {
    width: "100%",
    height: "100%",
    playerVars: { autoplay: 1, controls: 1, modestbranding: 1, rel: 0 },
  };

  const onReady = (event: any) => (playerRef.current = event.target);

  /** 🔁 Fetch Related + Playlist data */
  useEffect(() => {
    if (!videoId) return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        // 🎵 Related videos
        const relatedRes = await fetch(`/api/scrape?v=${videoId}`);
        const relatedData = await relatedRes.json();
        setRelatedVideos(relatedData.success ? relatedData.videos || [] : []);

        // 📜 Playlist videos (if any)
        if (playlistId) {
          const playlistRes = await fetch(`/api/playlist?list=${playlistId}`);
          const playlistData = await playlistRes.json();
          if (playlistData.success) {
            setPlaylistVideos(playlistData.videos || []);
            setPlaylistTitle(playlistData.title || "Playlist");
            setPlaylistInfo({
              channel: playlistData.channel || "",
              total: playlistData.total || "",
            });
          }
        } else {
          setPlaylistVideos([]);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setRelatedVideos([]);
        setPlaylistVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [videoId, playlistId]);

  /** 🎛 Player size controls */
  const handleChangeSize = (key: "s" | "m" | "l" | "t" | "et" | "f") => {
    const map: Record<string, string> = {
      s: "max-w-[300px]",
      m: "max-w-[350px]",
      l: "max-w-[500px]",
      t: "max-w-[50%]",
      et: "max-w-[75%]",
      f: "max-w-[85%]",
    };
    setSize(map[key]);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;

      // ✅ Ignore key presses if typing in an input, textarea, or contenteditable
      if (
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.isContentEditable)
      ) {
        return;
      }

      if (
        event.key === "Escape" &&
        (size === "max-w-[85%]" ||
          size === "max-w-[75%]" ||
          size === "max-w-[50%]")
      ) {
        setSize("max-w-[350px]");
        return;
      }

      switch (event.key) {
        case "1":
          setSize("max-w-[300px]");
          break;
        case "2":
          setSize("max-w-[350px]");
          break;
        case "3":
          setSize("max-w-[500px]");
          break;
        case "4":
          setSize("max-w-[50%]");
          break;
        case "5":
          setSize("max-w-[75%]");
          break;
        case "6":
          setSize("max-w-[85%]");
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [size]);

  const isCentered =
    size === "max-w-[75%]" || size === "max-w-[50%]" || size === "max-w-[85%]";

  if (!videoId)
    return (
      <main className="flex items-center justify-center h-screen text-gray-400">
        No video selected
      </main>
    );

  return (
    <div
      className={`flex flex-col p-4 h-[calc(100vh-72px)] bg-[url(/images/bg.png)] ${
        isCentered ? "items-center justify-center" : "items-end justify-end"
      }`}
    >
      {size != "max-w-[85%]" && (
        <div className={`flex gap-2 mb-4 justify-end ${size} w-full`}>
          {["s", "m", "l", "t", "et", "f"].map((k) => (
            <button
              key={k}
              className="bg-[#989898] rounded-sm w-[33px] h-[33px] hover:bg-white"
              onClick={() => handleChangeSize(k as any)}
            >
              {k.toUpperCase()}
            </button>
          ))}
        </div>
      )}
      {size === "max-w-[85%]" && (
        <div className=" absolute top-0 right-0">
          <p className=" px-2 rounded-xs bg-white text-red-500 font-semibold">{`Press "ESC" button to exit large screen`}</p>
        </div>
      )}
      <div
        className={`relative w-full ${size}`}
        style={{ aspectRatio: "16/9" }}
      >
        <YouTube
          videoId={videoId}
          onReady={onReady}
          opts={opts}
          className="absolute inset-0 w-full h-full rounded-lg overflow-hidden"
        />
      </div>

      {size != "max-w-[85%]" && (
        <Sheet>
          <SheetTrigger asChild>
            <button className="bg-[#989898] hover:bg-white text-black mt-4 w-[33px] h-[33px] rounded-sm">
              R
            </button>
          </SheetTrigger>

          <SheetContent
            side="right"
            className="scrollbar-thin bg-[#111]/90 backdrop-blur-md border-none text-white w-[380px] sm:w-[420px] overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle className="text-lg font-bold text-white mb-2">
                {playlistId ? playlistTitle : "Up Next"}
              </SheetTitle>
            </SheetHeader>

            {loading ? (
              <div className="p-4 text-gray-400 text-center">Loading...</div>
            ) : (
              <div className="flex flex-col">
                {playlistVideos.length > 0 && (
                  <div className="mb-6 border-b border-white/10">
                    <div className="px-3 pb-2">
                      <p className="text-sm text-gray-400">
                        {playlistInfo.channel} • {playlistInfo.total}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 h-[50vh] overflow-auto">
                      {playlistVideos.map((v, i) => (
                        <Link
                          key={v.id}
                          href={`/w?v=${v.id}&list=${playlistId}`}
                          className={`flex gap-3 p-2 rounded-md transition ${
                            v.id === videoId
                              ? "bg-[#333] border-l-4 border-red-500"
                              : "hover:bg-[#2b2b2b]"
                          }`}
                        >
                          <div className="relative">
                            <Image
                              src={v.thumbnail}
                              alt={v.title}
                              height={80}
                              width={140}
                              className="rounded-md aspect-video object-cover"
                            />
                            {v.duration && (
                              <span className="absolute bottom-1 right-1 bg-black/80 text-xs px-1.5 py-0.5 rounded">
                                {v.duration}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col text-sm flex-1">
                            <p className="font-semibold line-clamp-2">
                              {i + 1}. {v.title}
                            </p>
                            <p className="text-gray-400 text-xs mt-1">
                              {v.channel?.title}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  {/* <h3 className="px-3 text-base font-semibold mb-2 text-white">
                    Up Next
                  </h3> */}
                  {relatedVideos.length > 0 ? (
                    <div className="flex flex-col gap-3 px-2 pb-4">
                      {relatedVideos.map((v) => (
                        <Link
                          key={v.id}
                          href={`/w?v=${v.id}`}
                          className="flex gap-4 hover:bg-[#2b2b2b] rounded-lg p-2 transition"
                        >
                          <div className="relative">
                            <Image
                              src={v.thumbnail}
                              alt={v.title}
                              height={100}
                              width={180}
                              className="rounded-md aspect-video object-cover"
                            />
                            {v.type === "playlist" ? (
                              <span className="absolute bottom-1 right-1 bg-black/80 text-xs px-1.5 py-0.5 rounded flex items-center gap-1 text-white">
                                <ListVideo size={12} className="text-white" />
                                <span className="text-[10px] font-medium">
                                  PLAYLIST
                                </span>
                              </span>
                            ) : v.duration ? (
                              <span className="absolute bottom-1 right-1 bg-black/80 text-xs px-1.5 py-0.5 rounded text-white">
                                {v.duration}
                              </span>
                            ) : null}
                          </div>
                          <div className="flex flex-col text-sm flex-1">
                            <p className="font-semibold line-clamp-2">
                              {v.title}
                            </p>
                            <p className="text-gray-400 text-xs mt-1">
                              {v.channel?.title}
                            </p>
                            <p className="text-gray-500 text-xs mt-auto">
                              {v.views} • {v.publishedAt}
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
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
