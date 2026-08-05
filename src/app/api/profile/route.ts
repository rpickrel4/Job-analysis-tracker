import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { INTERVIEW_QUESTIONS } from "@/lib/interviewQuestions";

export async function GET() {
  const [profile, answers] = await Promise.all([
    prisma.profile.findUnique({ where: { id: 1 } }),
    prisma.interviewAnswer.findMany({ orderBy: { updatedAt: "asc" } }),
  ]);

  return NextResponse.json({
    profile,
    answeredCount: answers.length,
    totalQuestions: INTERVIEW_QUESTIONS.length,
  });
}
