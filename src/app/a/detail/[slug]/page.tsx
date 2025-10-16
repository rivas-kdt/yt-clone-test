"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type Episode = {
  id: string;
  epNum: string;
  title: string;
  url: string;
};

type AnimeDetail = {
  success: boolean;
  id: string;
  slug: string;
  title: string;
  posterImg: string;
  synopsis: string;
  info: Record<string, string | string[]>;
  episodes: Episode[];
};

export default function AnimeDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const animeId = params?.slug as string;
  const ep = searchParams.get("ep") || "";

  const [anime, setAnime] = useState<AnimeDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnime() {
      try {
        setLoading(true);
        const url = `/api/9anime/watch/${animeId}${ep ? `?ep=${ep}` : ""}`;
        const { data } = await axios.get(url);
        setAnime(data);
      } catch (error) {
        console.error("Error fetching anime:", error);
      } finally {
        setLoading(false);
      }
    }
    if (animeId) fetchAnime();
  }, [animeId, ep]);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-screen text-white">
        Loading...
      </div>
    );

  if (!anime || !anime.success)
    return (
      <div className="flex flex-col items-center justify-center h-screen text-white">
        Error: Anime not found.
      </div>
    );

  return (
    <div className="flex justify-end items-end h-[calc(100vh-72px)] bg-[url(/images/bg.png)] p-12 pb-0 text-white gap-8">
      <div className="flex-shrink bg-[#353535]/40 rounded-xl p-6 overflow-y-auto">
        <h1 className="text-2xl font-semibold mb-4 text-center">
          {anime.title}
        </h1>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="secondary"
              className="bg-[#2b2b2b] hover:bg-[#1f1f1f] text-white w-full"
            >
              View Details
            </Button>
          </SheetTrigger>

          <SheetContent
            side="right"
            className="bg-[#1f1f1f] border-none text-gray-200 overflow-y-auto px-4"
          >
            <SheetHeader>
              <SheetTitle className="text-xl font-semibold text-white">
                {anime.title}
              </SheetTitle>
              <SheetDescription className="text-gray-400">
                Detailed information about this anime.
              </SheetDescription>
            </SheetHeader>

            {/* Poster */}
            <div className="mt-4">
              <Image
                src={anime.posterImg}
                alt={anime.title}
                width={250}
                height={350}
                className="rounded-lg object-cover mx-auto"
              />
            </div>

            {/* Synopsis */}
            <div className="mt-4 text-sm leading-relaxed text-gray-300">
              <p>{anime.synopsis}</p>
            </div>

            {/* Info Section */}
            <div className="mt-5 bg-[#2b2b2b]/70 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">Information</h3>
              <ul className="space-y-1 text-gray-400 text-sm">
                {Object.entries(anime.info).map(([key, value]) => (
                  <li key={key}>
                    <span className="font-medium text-gray-300">
                      {key[0].toUpperCase() + key.slice(1)}:
                    </span>{" "}
                    {Array.isArray(value) ? value.join(", ") : value}
                  </li>
                ))}
              </ul>
            </div>
          </SheetContent>
        </Sheet>
        <h3 className="text-lg font-semibold mb-4">Episodes</h3>
        <div className="flex flex-col gap-2">
          {anime.episodes.map((ep) => (
            <Link
              key={ep.id}
              href={`/a/watch/${animeId}?ep=${ep.id}`}
              className="bg-[#2b2b2b] hover:bg-[#1f1f1f] px-3 py-2 rounded-md text-sm text-gray-200 transition"
            >
              Episode {ep.epNum}: {ep.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
