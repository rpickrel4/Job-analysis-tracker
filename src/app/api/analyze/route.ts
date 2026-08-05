import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchPostingText } from "@/lib/jobFetch";
import { analyzeJobPosting } from "@/lib/ai";
import { MissingApiKeyError } from "@/lib/anthropic";
import type { CandidateProfileJson } from "@/lib/types";

export const runtime = "nodejs";
// Headless-browser rendering (the fallback for JS-rendered postings) can
// take a while; request the longest execution window Vercel allows. Hobby
// plan projects are capped lower than this regardless.
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { url, text } = body as { url?: string; text?: string };

  if (!url && !text) {
    return NextResponse.json(
      { error: "Provide a posting URL or pasted text." },
      { status: 400 }
    );
  }

  let postingText = text?.trim() || "";
  let fetchedTitle: string | null = null;

  if (!postingText && url) {
    try {
      const fetched = await fetchPostingText(url);
      postingText = fetched.text;
      fetchedTitle = fetched.title;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch URL.";
      return NextResponse.json({ error: message, needsManualText: true }, { status: 422 });
    }
  }

  if (!postingText || postingText.length < 50) {
    return NextResponse.json(
      { error: "Not enough posting text to analyze." },
      { status: 400 }
    );
  }

  const profile = await prisma.profile.findUnique({ where: { id: 1 } });
  const profileJson: CandidateProfileJson | null = profile?.profileJson
    ? JSON.parse(profile.profileJson)
    : null;

  try {
    const analysis = await analyzeJobPosting({
      postingText,
      profile: profileJson,
      url,
    });

    const saved = await prisma.jobAnalysis.create({
      data: {
        url: url || null,
        rawText: postingText,
        company: analysis.company.name,
        position: analysis.position.title ?? fetchedTitle,
        industry: analysis.company.industry,
        location: analysis.position.location,
        employmentType: analysis.position.employmentType,
        compensation: analysis.position.compensation,
        summary: analysis.summary,
        fitScore: analysis.fit.score ?? null,
        analysisJson: JSON.stringify(analysis),
      },
    });

    return NextResponse.json({ jobAnalysis: saved, analysis });
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Failed to analyze posting.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
