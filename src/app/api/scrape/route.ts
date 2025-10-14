import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { NextResponse } from "next/server";

export async function GET() {
  const executablePath = await chromium.executablePath();

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: chromium.headless,
  });

  const page = await browser.newPage();
  await page.goto("https://www.youtube.com/watch?v=Sklc_fQBmcs", {
    waitUntil: "networkidle2",
  });

  await page.waitForSelector("#related #items", { timeout: 10000 });
  const html = await page.$eval("#related #items", (el) => el.innerHTML);

  await browser.close();

  return NextResponse.json({ success: true, html });
}
