/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { chromium } from "playwright-chromium";

const BASE_URL = "https://gogoanime.by";

export async function GET(
  request: Request,
  { params }: { params: { episodeId: string } }
) {
  const { episodeId } = params;

  if (!episodeId) {
    return NextResponse.json({
      success: false,
      message: "Missing episode ID",
    });
  }

  try {
    const { searchParams } = new URL(request.url);
    const serverQuery = (searchParams.get("server") || "Blogger").toLowerCase();

    // Launch headless Chromium safely for Vercel
    const browser = await chromium.launch({
      headless: true,
      args: [
        "--disable-dev-shm-usage",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
      ],
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to episode page
    await page.goto(`${BASE_URL}/${episodeId}`, { waitUntil: "networkidle" });

    // Wait up to 5 seconds for iframe to appear
    const iframeHandle = await page.waitForSelector("#player iframe", { timeout: 5000 });
    if (!iframeHandle) {
      await browser.close();
      return NextResponse.json({
        success: false,
        message: "No iframe found — page uses JS injection.",
      });
    }

    // Get iframe src
    let iframeSrc = await iframeHandle.getAttribute("src");
    if (!iframeSrc) {
      await browser.close();
      return NextResponse.json({
        success: false,
        message: "Iframe src not found",
      });
    }

    // Make sure absolute URL
    if (iframeSrc.startsWith("/")) iframeSrc = BASE_URL + iframeSrc;

    // Navigate to iframe page
    await page.goto(iframeSrc, { waitUntil: "networkidle" });

    // Extract servers
    const servers = await page.$$eval("#servers li", (list) =>
      list
        .map((el) => {
          const type = el.getAttribute("data-type");
          const enc1 = el.getAttribute("data-encrypted-url");
          const enc2 = el.getAttribute("data-encrypted-url2");
          const enc3 = el.getAttribute("data-encrypted-url3");
          return type && (enc1 || enc2 || enc3)
            ? { type, encryptedUrls: [enc1, enc2, enc3].filter(Boolean) }
            : null;
        })
        .filter(Boolean)
    );

    // Pick server
    const selected =
      servers.find((s: any) => s.type.toLowerCase() === serverQuery) || servers[0];

    const decryptedUrls = selected
      ? selected.encryptedUrls
          .map((e: string | null) => {
            try {
              return e ? Buffer.from(e, "base64").toString("utf8") : null;
            } catch {
              return null;
            }
          })
          .filter(Boolean)
      : [];

    await browser.close();

    return NextResponse.json({
      success: true,
      episodeId,
      iframeSrc,
      selectedServer: selected?.type || null,
      decryptedUrls,
      servers,
    });
  } catch (err: any) {
    console.error("Scrape error:", err);
    return NextResponse.json({ success: false, message: err.message });
  }
}
