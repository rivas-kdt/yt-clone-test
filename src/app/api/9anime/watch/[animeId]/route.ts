/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

const BASE_URL = "https://9animetv.to";

export async function GET(
  request: Request,
  context: { params: Promise<{ animeId: string }> } // ✅ FIX: params is Promise
) {
  const { animeId: animeSlug } = await context.params; // ✅ FIX: await it
  const { searchParams } = new URL(request.url);
  const episode = searchParams.get("ep") || "";

  if (!animeSlug) {
    return NextResponse.json(
      { success: false, message: "Missing animeId in route." },
      { status: 400 }
    );
  }

  const animeIdMatch = animeSlug.match(/-(\d+)$/);
  const animeId = animeIdMatch ? animeIdMatch[1] : "";

  if (!animeId) {
    return NextResponse.json(
      { success: false, message: "Failed to extract anime ID from slug." },
      { status: 400 }
    );
  }

  try {
    const animeUrl = `/watch/${animeSlug}${episode ? `?ep=${episode}` : ""}`;
    const fullUrl = `${BASE_URL}${animeUrl}`;

    const pageRes = await axios.get(fullUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const $ = cheerio.load(pageRes.data);

    const title = $(".anime-detail .film-infor-top h2").text().trim();
    const posterImg = $(".anime-detail .film-poster img").attr("src") || "";
    const synopsis = $(".anime-detail .film-description p").text().trim();

    const info: Record<string, string | string[]> = {};
    $(".anime-detail .meta .item").each((_, el) => {
      const label = $(el)
        .find(".item-title")
        .text()
        .replace(":", "")
        .trim()
        .toLowerCase();
      const contentEl = $(el).find(".item-content");

      if (!label) return;

      let value: string | string[] = "";
      if (contentEl.find("a").length > 0) {
        value = contentEl
          .find("a")
          .map((_, a) => $(a).text().trim())
          .get();
      } else {
        value = contentEl.text().trim();
      }

      info[label] = value;
    });

    const ajaxUrl = `${BASE_URL}/ajax/episode/list/${animeId}`;
    const epRes = await axios.get(ajaxUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const $$ = cheerio.load(epRes.data.html || epRes.data);

    const episodes: {
      id: string;
      epNum: string;
      title: string;
      url: string;
    }[] = [];

    $$("a").each((_, el) => {
      const epUrl = $$(el).attr("href") || "";
      const epTitle = $$(el).attr("title")?.trim() || "";
      const epId = $$(el).attr("data-id") || "";
      const epNum = $$(el).attr("data-number") || "";

      if (epUrl) {
        episodes.push({
          id: epId,
          epNum,
          title: epTitle,
          url: epUrl.startsWith("http") ? epUrl : `${BASE_URL}${epUrl}`,
        });
      }
    });

    episodes.sort((a, b) => Number(a.epNum) - Number(b.epNum));

    return NextResponse.json({
      success: true,
      id: animeId,
      slug: animeSlug,
      title,
      posterImg,
      synopsis,
      info,
      episodes,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Error fetching anime info",
        error: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
