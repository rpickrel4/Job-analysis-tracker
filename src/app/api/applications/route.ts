import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const applications = await prisma.application.findMany({
    orderBy: { dateApplied: "desc" },
  });
  return NextResponse.json({ applications });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    company,
    position,
    industry,
    compensation,
    location,
    dateApplied,
    status,
    postingLink,
    summary,
    notes,
    source,
    jobAnalysisId,
  } = body as Record<string, unknown>;

  if (!company || typeof company !== "string") {
    return NextResponse.json({ error: "company is required." }, { status: 400 });
  }
  if (!position || typeof position !== "string") {
    return NextResponse.json({ error: "position is required." }, { status: 400 });
  }

  const application = await prisma.application.create({
    data: {
      company,
      position,
      industry: typeof industry === "string" ? industry : null,
      compensation: typeof compensation === "string" ? compensation : null,
      location: typeof location === "string" ? location : null,
      dateApplied: dateApplied ? new Date(dateApplied as string) : new Date(),
      status: typeof status === "string" && status ? status : "Applied",
      postingLink: typeof postingLink === "string" ? postingLink : null,
      summary: typeof summary === "string" ? summary : null,
      notes: typeof notes === "string" ? notes : null,
      source: typeof source === "string" && source ? source : "manual",
      jobAnalysisId: typeof jobAnalysisId === "number" ? jobAnalysisId : null,
    },
  });

  return NextResponse.json({ application }, { status: 201 });
}
