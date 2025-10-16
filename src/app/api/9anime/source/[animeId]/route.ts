/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

const BASE_URL = "https://9animetv.to";

/**
 * Example:
 * /api/9anime/source/gachiakuta-19785?ep=141674
 */
export async function GET(
  request: Request,
  { params }: { params: { animeId: string } }
) {
  const { searchParams } = new URL(request.url);
  const { animeId } = params;
  const episodeId = searchParams.get("ep");

  if (!animeId || !episodeId) {
    return NextResponse.json(
      { success: false, message: "Missing animeId or episodeId (?ep=) in request." },
      { status: 400 }
    );
  }

  try {
    // 1️⃣ Fetch list of available servers for this episode
    const serversUrl = `${BASE_URL}/ajax/episode/servers?episodeId=${episodeId}`;
    const res = await axios.get(serversUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!res.data?.html) {
      return NextResponse.json(
        { success: false, message: "No HTML found in server response." },
        { status: 404 }
      );
    }

    const $ = cheerio.load(res.data.html);
    const serverItems: { id: string; type: string; name: string; serverId: string }[] = [];

    $(".server-item").each((_, el) => {
      const id = $(el).attr("data-id") || "";
      const type = $(el).attr("data-type") || "";
      const serverId = $(el).attr("data-server-id") || "";
      const name = $(el).find(".btn").text().trim();
      if (id) serverItems.push({ id, type, name, serverId });
    });

    if (serverItems.length === 0) {
      return NextResponse.json(
        { success: false, message: "No servers found for this episode." },
        { status: 404 }
      );
    }

    // 2️⃣ Choose the preferred server (Vidstreaming or fallback to first)
    const preferred =
      serverItems.find((s) => s.name.toLowerCase().includes("vidstream")) ||
      serverItems[0];

    // 3️⃣ Fetch the actual playable video source
    const sourceUrl = `${BASE_URL}/ajax/episode/sources?id=${preferred.id}`;
    const sourceRes = await axios.get(sourceUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const { link, server } = sourceRes.data || {};

    if (!link) {
      return NextResponse.json(
        { success: false, message: "No video source found in episode data." },
        { status: 404 }
      );
    }

    // 4️⃣ Return structured JSON
    return NextResponse.json({
      success: true,
      animeId,
      episodeId,
      selectedServer: preferred,
      video: {
        link,
        server,
      },
      allServers: serverItems,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Error fetching video source.",
        error: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
