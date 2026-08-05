import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chatAboutAnalysis } from "@/lib/ai";
import { MissingApiKeyError } from "@/lib/anthropic";
import type { CandidateProfileJson, JobAnalysisJson } from "@/lib/types";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const jobAnalysisId = Number(id);
  if (!Number.isInteger(jobAnalysisId)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { jobAnalysisId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const jobAnalysisId = Number(id);
  if (!Number.isInteger(jobAnalysisId)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const body = await request.json();
  const { question } = body as { question?: string };
  if (!question || !question.trim()) {
    return NextResponse.json({ error: "question is required." }, { status: 400 });
  }

  const [jobAnalysis, profile, priorMessages] = await Promise.all([
    prisma.jobAnalysis.findUnique({ where: { id: jobAnalysisId } }),
    prisma.profile.findUnique({ where: { id: 1 } }),
    prisma.chatMessage.findMany({
      where: { jobAnalysisId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!jobAnalysis) {
    return NextResponse.json({ error: "Analysis not found." }, { status: 404 });
  }

  const profileJson: CandidateProfileJson | null = profile?.profileJson
    ? JSON.parse(profile.profileJson)
    : null;
  const analysis: JobAnalysisJson = JSON.parse(jobAnalysis.analysisJson);

  try {
    const answer = await chatAboutAnalysis({
      postingText: jobAnalysis.rawText,
      analysis,
      profile: profileJson,
      history: priorMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      question: question.trim(),
    });

    const [userMessage, assistantMessage] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: { jobAnalysisId, role: "user", content: question.trim() },
      }),
      prisma.chatMessage.create({
        data: { jobAnalysisId, role: "assistant", content: answer },
      }),
    ]);

    return NextResponse.json({ userMessage, assistantMessage });
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Failed to get a response.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
