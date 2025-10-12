/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { useSearch } from "./context/SearchContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

function titleCleaner(title: string) {
  return title
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export default function Home() {
  const { query } = useSearch();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (query) {
        setLoading(true);
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`
        );
        const data = await response.json();
        setResults(data);
        setLoading(false);
        console.log("Search results:", data);
      }
    };
    fetchSearchResults();
  }, [query]);

  console.log("Results: ", results);

  return (
    <main className=" flex items-center p-12 pb-0 flex-col">
      {/* <h1 className=" text-4xl font-bold">{loading ? "loading..." : query}</h1> */}
      {loading ? (
        <Skeleton className="w-full min-h-[calc(100vh-168px)]" />
      ) : (
        <div className=" w-full min-h-[calc(100vh-120px)] overflow-auto no-scrollbar">
          {query === "" ? (
            <p className=" text-center mt-8">Type something to search</p>
          ) : results.length === 0 ? (
            <p className=" text-center mt-8"></p>
          ) : (
            <>
              <p className=" font-bold text-2xl pb-4">Playlist</p>
              <div className=" grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {results[0].playlists.map((playlist: any) => (
                  <div key={playlist.id}>
                    <img src={playlist.thumbnail} alt={playlist.title} />
                    <p>{titleCleaner(playlist.title)}</p>
                    <p className=" text-sm text-gray-400">
                      Playlist by {titleCleaner(playlist.owner)}
                    </p>
                  </div>
                ))}
              </div>
              <Separator />
              <p className=" font-bold text-2xl py-4">Videos</p>
              <div className=" grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {results[0].videos.map((video: any) => (
                  <div key={video.id} className=" flex flex-col gap-2">
                    <img src={video.thumbnail} alt={video.title} />
                    <div className=" flex flex-col gap-0">
                      <p className="text-white font-bold break-words">
                        {titleCleaner(video.title)}
                      </p>
                      <p className=" text-sm text-gray-400">
                        {titleCleaner(video.channel.title)}
                      </p>
                    </div>
                    {/* <p>{video.title}</p> */}
                  </div>
                ))}
              </div>
            </>
          )}
          {/* {results.length > 0 ? (
            <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results[0].videos.map((video: any) => (
                <div
                  key={video.id}
                  className=" bg-[#3b3b3b] p-4 rounded-lg hover:bg-[#4b4b4b] transition cursor-pointer"
                >
          <div></div> */}
        </div>
      )}
    </main>
  );
}
