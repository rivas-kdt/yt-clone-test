import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

const BASE_URL = "https://gogoanime.by";

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
    `${BASE_URL}/?s=${encodeURIComponent(query)}`,
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
      type: string;
      status: string;
      vo: string;
    }[] = [];

    if ($(".bs").length === 0) {
      return NextResponse.json(
        {
          message: "No results found",
        },
        { status: 240 }
      );
    }

    $(".bs").each((index, element) => {
      const href = $(element).find(".bsx a").attr("href");
      const id = href ? href.split("/series/")[1]?.replace("/", "") : "";
      const title = $(element).find(".bsx a .tt h2").text().trim();
      const url = $(element).find(".bsx a").attr("href");
      const img = $(element).find(".bsx .limit img").attr("src");
      const type = $(element).find(".bsx .typez").text().trim();
      const status = $(element).find(".bsx .epx").text().trim();
      const vo = $(element).find(".bsx .sb").text().trim();
      searchData.push({ id, title, url, img, type, status, vo });
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
