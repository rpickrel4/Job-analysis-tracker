import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// @sparticuz/chromium-min doesn't bundle the ~65MB Chromium binary (which
// risks blowing past Vercel's deployment size limit) — instead it downloads
// it once per cold start from this pack URL and caches it in /tmp. Keep
// this version in sync with the @sparticuz/chromium-min package version in
// package.json; the pack is published at that same version tag.
const CHROMIUM_PACK_URL =
  "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar";

/**
 * Renders a page with a real (headless) browser, including its JavaScript.
 * Many ATS platforms (BambooHR, Greenhouse, Lever, Workday, etc.) load the
 * actual job description client-side after the initial page load, so a
 * plain fetch() of the server's HTML often comes back empty — this is the
 * fallback for those cases.
 */
export async function fetchRenderedHtml(url: string, timeoutMs: number): Promise<string> {
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(CHROMIUM_PACK_URL),
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(url, { waitUntil: "networkidle2", timeout: timeoutMs });
    return await page.content();
  } finally {
    await browser.close();
  }
}
