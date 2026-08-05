import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const applicationId = Number(id);
  if (!Number.isInteger(applicationId)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

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
  } = body as Record<string, unknown>;

  const data: Record<string, unknown> = {};
  if (typeof company === "string") data.company = company;
  if (typeof position === "string") data.position = position;
  if (typeof industry === "string") data.industry = industry;
  if (typeof compensation === "string") data.compensation = compensation;
  if (typeof location === "string") data.location = location;
  if (typeof dateApplied === "string") data.dateApplied = new Date(dateApplied);
  if (typeof status === "string") data.status = status;
  if (typeof postingLink === "string") data.postingLink = postingLink;
  if (typeof summary === "string") data.summary = summary;
  if (typeof notes === "string") data.notes = notes;

  try {
    const application = await prisma.application.update({
      where: { id: applicationId },
      data,
    });
    return NextResponse.json({ application });
  } catch {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const applicationId = Number(id);
  if (!Number.isInteger(applicationId)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  try {
    await prisma.application.delete({ where: { id: applicationId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }
}
