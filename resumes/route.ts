import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canCreateResume } from "@/lib/subscription";

const createSchema = z.object({
  title: z.string().min(1).max(120),
  rawText: z.string().default(""),
  jdText: z.string().default(""),
  jdUrl: z.string().optional(),
  keywords: z.string().default("[]"),
  atsScore: z.number().int().min(0).max(100).default(0),
  contentJson: z.string().default("{}"),
  coverLetter: z.string().optional(),
  templateId: z.string().default("classic"),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resumes = await prisma.resume.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      atsScore: true,
      templateId: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ resumes });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await canCreateResume(session.user.id);
  if (!allowed) {
    return NextResponse.json(
      { error: "Free plan allows 1 resume. Upgrade to Pro for unlimited resumes." },
      { status: 403 },
    );
  }

  try {
    const json = await req.json();
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const resume = await prisma.resume.create({
      data: {
        userId: session.user.id,
        title: parsed.data.title,
        rawText: parsed.data.rawText,
        jdText: parsed.data.jdText,
        jdUrl: parsed.data.jdUrl ?? null,
        keywords: parsed.data.keywords,
        atsScore: parsed.data.atsScore,
        contentJson: parsed.data.contentJson,
        coverLetter: parsed.data.coverLetter ?? null,
        templateId: parsed.data.templateId,
      },
    });

    return NextResponse.json({ resume });
  } catch {
    return NextResponse.json({ error: "Could not save resume" }, { status: 500 });
  }
}
