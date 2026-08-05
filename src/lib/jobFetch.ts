import { parseHTML } from "linkedom";
import { Readability } from "@mozilla/readability";

export type FetchedPosting = {
  title: string | null;
  text: string;
};

/**
 * Best-effort fetch of a job posting URL. Many sites (LinkedIn especially)
 * block server-side/anonymous requests or require login, so this can and
 * will fail — callers should fall back to letting the user paste the
 * posting text manually rather than treating this as reliable.
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let html: string;
  try {
    const response = await fetch(parsed.toString(), {
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
    html = await response.text();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Couldn't fetch that URL automatically (${message}). Paste the job description text instead.`
    );
  } finally {
    clearTimeout(timeout);
  }

  try {
    const { document } = parseHTML(html, { location: parsed });
    const reader = new Readability(document as unknown as Document);
    const article = reader.parse();
    const text = (article?.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim();

    if (!text || text.length < 200) {
      throw new Error("Extracted content was too short to be a real job posting");
    }

    return { title: article?.title ?? null, text };
  } catch {
    throw new Error(
      "Fetched the page but couldn't extract the posting content (common with LinkedIn/logged-in-only pages). Paste the job description text instead."
    );
  }
}
