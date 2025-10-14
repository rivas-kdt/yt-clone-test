import chromium from "chrome-aws-lambda";
import puppeteer from "puppeteer-core";
import { NextResponse } from "next/server";

export async function GET() {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
  });

  const page = await browser.newPage();
  await page.goto("https://www.youtube.com/watch?v=Sklc_fQBmcs", {
    waitUntil: "networkidle2",
  });

  await page.waitForSelector("#related #items");
  const relatedHTML = await page.$eval("#related #items", (el) => el.innerHTML);

  await browser.close();

  return NextResponse.json({ success: true, relatedHTML });
}
