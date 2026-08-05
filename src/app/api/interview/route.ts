import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { INTERVIEW_QUESTIONS } from "@/lib/interviewQuestions";

export async function GET() {
  const answers = await prisma.interviewAnswer.findMany();
  const answersByQuestionId = Object.fromEntries(
    answers.map((a) => [a.questionId, a])
  );

  const questions = INTERVIEW_QUESTIONS.map((q) => ({
    ...q,
    answer: answersByQuestionId[q.id]?.answer ?? "",
  }));

  return NextResponse.json({ questions });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { questionId, answer } = body as { questionId?: string; answer?: string };

  if (!questionId || typeof answer !== "string") {
    return NextResponse.json(
      { error: "questionId and answer are required." },
      { status: 400 }
    );
  }

  const question = INTERVIEW_QUESTIONS.find((q) => q.id === questionId);
  if (!question) {
    return NextResponse.json({ error: "Unknown questionId." }, { status: 400 });
  }

  const saved = await prisma.interviewAnswer.upsert({
    where: { questionId },
    update: { answer, question: question.question, category: question.category },
    create: {
      questionId,
      answer,
      question: question.question,
      category: question.category,
    },
  });

  return NextResponse.json({ answer: saved });
}
