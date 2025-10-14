/* eslint-disable @typescript-eslint/no-explicit-any */
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { NextResponse } from "next/server";

export async function GET() {
  const execPath = await (chromium as any).executablePath();

  const browser = await puppeteer.launch({
    args: (chromium as any).args,
    executablePath: execPath,
    headless: true, // 👈 use Puppeteer's own flag instead
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
