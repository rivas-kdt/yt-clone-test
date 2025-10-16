import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

const BASE_URL = "https://9animetv.to";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      {
        success: false,
        message: "Missing query parameter ?q=",
      },
      { status: 400 }
    );
  }

  const mainPage = await axios.get(
    `${BASE_URL}/search?keyword=${encodeURIComponent(query)}`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
      },
    }
  );

  const $ = cheerio.load(mainPage.data);
  try {
    const searchData: {
      id: string;
      title: string;
      url: string | undefined;
      img: string | undefined;
    }[] = [];

    if ($(".flw-item").length === 0) {
      return NextResponse.json(
        {
          message: "No results found",
        },
        { status: 240 }
      );
    }

    $(".flw-item").each((index, element) => {
      const href = $(element).find(".film-poster a").attr("href");
      const id = href ? href.split("/watch/")[1]?.replace("/", "") : "";
      const title = $(element).find(".film-name a").text().trim();
      const url = $(element).find(".film-poster a").attr("href");
      const imgElement = $(element).find(".film-poster .film-poster-img");
      const img = imgElement.attr("data-src") || imgElement.attr("src") || "";
      searchData.push({ id, title, url, img });
    });

    return NextResponse.json({ results: searchData }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Error fetching search results",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
