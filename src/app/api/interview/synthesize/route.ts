import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { synthesizeProfile } from "@/lib/ai";
import { MissingApiKeyError } from "@/lib/anthropic";

export async function POST() {
  const [profile, answers] = await Promise.all([
    prisma.profile.findUnique({ where: { id: 1 } }),
    prisma.interviewAnswer.findMany(),
  ]);

  if (!profile?.resumeText && answers.length === 0) {
    return NextResponse.json(
      { error: "Upload a resume or answer at least one interview question first." },
      { status: 400 }
    );
  }

  try {
    const profileJson = await synthesizeProfile({
      resumeText: profile?.resumeText ?? null,
      answers,
    });

    const updated = await prisma.profile.upsert({
      where: { id: 1 },
      update: {
        profileJson: JSON.stringify(profileJson),
        profileSummary: profileJson.summary,
      },
      create: {
        id: 1,
        profileJson: JSON.stringify(profileJson),
        profileSummary: profileJson.summary,
      },
    });

    return NextResponse.json({ profile: updated, profileJson });
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Failed to synthesize profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
