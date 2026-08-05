import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractResumeText } from "@/lib/resume";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("resume");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No resume file provided." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let text: string;
  try {
    text = await extractResumeText(buffer, file.name);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to parse resume.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (!text) {
    return NextResponse.json(
      { error: "Couldn't extract any text from that file." },
      { status: 400 }
    );
  }

  const profile = await prisma.profile.upsert({
    where: { id: 1 },
    update: { resumeText: text, resumeFileName: file.name },
    create: { id: 1, resumeText: text, resumeFileName: file.name },
  });

  return NextResponse.json({ profile });
}
