import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseTemplate } from "@/lib/subscription";

const patchSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  rawText: z.string().optional(),
  jdText: z.string().optional(),
  jdUrl: z.string().nullable().optional(),
  keywords: z.string().optional(),
  atsScore: z.number().int().min(0).max(100).optional(),
  contentJson: z.string().optional(),
  coverLetter: z.string().nullable().optional(),
  templateId: z.string().optional(),
});

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const resume = await prisma.resume.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!resume) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ resume });
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await prisma.resume.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const json = await req.json();
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (parsed.data.templateId) {
    if (!canUseTemplate(session.user.tier, parsed.data.templateId)) {
      return NextResponse.json(
        { error: "Template requires Pro subscription" },
        { status: 403 },
      );
    }
  }

  const resume = await prisma.resume.update({
    where: { id },
    data: {
      ...parsed.data,
      jdUrl: parsed.data.jdUrl === undefined ? undefined : parsed.data.jdUrl,
    },
  });

  return NextResponse.json({ resume });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await prisma.resume.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.resume.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
