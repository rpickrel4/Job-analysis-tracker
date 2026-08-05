import { parseHTML } from "linkedom";
import { Readability } from "@mozilla/readability";
import { fetchRenderedHtml } from "./browserFetch";

export type FetchedPosting = {
  title: string | null;
  text: string;
};

const MIN_TEXT_LENGTH = 200;

function extractFromHtml(html: string, url: URL): FetchedPosting | null {
  const { document } = parseHTML(html, { location: url });
  const reader = new Readability(document as unknown as Document);
  const article = reader.parse();
  const text = (article?.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim();

  if (!text || text.length < MIN_TEXT_LENGTH) {
    return null;
  }

  return { title: article?.title ?? null, text };
}

async function fetchStaticHtml(url: URL): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Best-effort fetch of a job posting URL. Tries a plain, fast fetch first;
 * many sites (LinkedIn especially) either block that or only load the real
 * description via JavaScript after the page loads, so if that doesn't
 * yield enough text, we fall back to rendering the page in a full headless
 * browser. Even that can fail (login walls, aggressive bot detection) —
 * callers should fall back to letting the user paste the posting text
 * manually rather than treating this as reliable.
 */
export async function fetchPostingText(url: string): Promise<FetchedPosting> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("That doesn't look like a valid URL.");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http/https URLs are supported.");
  }

  let staticExtractFailed = false;
  try {
    const html = await fetchStaticHtml(parsed);
    const result = extractFromHtml(html, parsed);
    if (result) return result;
    staticExtractFailed = true;
  } catch {
    staticExtractFailed = true;
  }

  if (staticExtractFailed) {
    try {
      const html = await fetchRenderedHtml(parsed.toString(), 25000);
      const result = extractFromHtml(html, parsed);
      if (result) return result;
    } catch {
      // fall through to the shared error below
    }
  }

  throw new Error(
    "Couldn't automatically extract the posting content (common with LinkedIn/logged-in-only pages, or pages that block automated browsers). Paste the job description text instead."
  );
}
