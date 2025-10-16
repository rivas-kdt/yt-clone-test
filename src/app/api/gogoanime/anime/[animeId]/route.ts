import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

const BASE_URL = "https://gogoanime.by";

export async function GET(
  request: Request,
  { params }: { params: { animeId: string } }
) {
  const { animeId } = params;

  if (!animeId) {
    return NextResponse.json(
      {
        success: false,
        message: "Missing animeId parameter in the URL",
      },
      { status: 400 }
    );
  }

  const mainPage = await axios.get(`${BASE_URL}/series/${animeId}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
    },
  });

  const $ = cheerio.load(mainPage.data);

  try {
    const cover = $(".bigcover img").attr("src");
    const thumbnail = $(".bigcontent .thumb img").attr("src");
    const title = $(".entry-title").text().trim();
    const description = $(".ninfo").find("p").first().text().trim();
    const trailer = $(".rt a").attr("href") || null;

    const info: {
      status?: string;
      studio?: string;
      released?: string;
      updated?: string;
      duration?: string;
      type?: string;
    } = {};

    $(".spe span").each((_, el) => {
      const label = $(el).find("b").text().trim().toLowerCase();
      const value = $(el).text().replace($(el).find("b").text(), "").trim();

      if (label.includes("status")) info.status = value;
      else if (label.includes("studio"))
        info.studio = $(el).find("a").text().trim();
      else if (label.includes("released"))
        info.released = value.replace("–", "-").trim();
      else if (label.includes("updated"))
        info.updated = value.replace("–", "-").trim();
      else if (label.includes("duration")) info.duration = value;
      else if (label.includes("type")) info.type = value;
    });

    const genres: string[] = [];

    $(".genxed a").each((_, el) => {
      genres.push($(el).text().trim());
    });

    const episodes: { episode: string | undefined; url: string | undefined }[] =
      [];

    $(".episode-item").each((_, element) => {
      const episode = $(element).attr("data-episode-number");
      const url = $(element).find("a").attr("href");
      episodes.push({ episode, url });
    });

    return NextResponse.json(
      {
        id: animeId,
        name: title,
        trailer: trailer,
        cover,
        thumbnail,
        description,
        type: info.type || "N/A",
        genres: genres,
        status: info.status || "N/A",
        released: info.released || "N/A",
        updated: info.updated || "N/A",
        studio: info.studio || "N/A",
        duration: info.duration || "N/A",
        episodes,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Error fetching anime details",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
