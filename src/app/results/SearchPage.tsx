/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { decrypt } from "@/lib/crypto";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

  const [youtubeResults, setYoutubeResults] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query || query === "undefined" || query.trim() === "") return;
      setLoading(true);
      setYoutubeResults([]); // clear previous
      try {
        const decrypted = decrypt(query);
        console.log("Decrypted query:", decrypted);
        const ytRes = await axios.get(
          `/api/youtube/search?q=${encodeURIComponent(decrypted)}`
        );
        setYoutubeResults(ytRes.data.videos || []);
      } catch (error) {
        console.error("Error fetching YouTube data:", error);
        setYoutubeResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  return (
    <main className="flex h-[calc(100vh-72px)] bg-[url(/images/bg.png)]">
      {/* Left side (main iframe or search placeholder) */}
      <div className="flex-1 relative bg-black overflow-hidden flex justify-center items-start">
        {loading ? (
          <Skeleton className="w-full h-full" />
        ) : (
          <div className="w-full h-full border-none bg-[url(/images/bg.png)]" />
        )}

        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-4 right-4 z-20 bg-gray-300 hover:bg-gray-400 text-black rounded-md p-2 transition"
          title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
        >
          {sidebarOpen ? <ChevronRight /> : <ChevronLeft />}
        </button>
      </div>

      {/* Right Sidebar */}
      <div
        className={`transition-all duration-300 ease-in-out bg-[#111]/95 backdrop-blur-md text-white border-l border-[#333] overflow-y-auto scrollbar-thin ${
          sidebarOpen ? "max-w-sm opacity-100" : "w-0 opacity-0 hidden"
        }`}
      >
        {sidebarOpen && (
          <div className="p-4">
            {loading ? (
              <p className="text-center mt-6 text-gray-400 text-sm">
                Loading...
              </p>
            ) : youtubeResults.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {youtubeResults.map((video: any) => (
                  <Link
                    key={video.id}
                    href={`/w?v=${video.id}`}
                    className="flex gap-3 hover:bg-[#2b2b2b] rounded-md p-2 transition"
                  >
                    <Image
                      src={video.thumbnail}
                      alt={video.title}
                      height={70}
                      width={120}
                      className="rounded-md object-cover"
                    />
                    <div className="flex flex-col justify-between">
                      <p className="text-sm text-white font-medium leading-tight line-clamp-2">
                        {titleCleaner(video.title)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {titleCleaner(video.channel.title)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center mt-6 text-gray-400 text-sm">
                No results found.
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
