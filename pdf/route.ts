import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildResumeHtmlDocument } from "@/lib/resume-html-string";
import { htmlToPdfBuffer } from "@/lib/puppeteer-pdf";
import { parseResumeContent } from "@/types/resume";
import { canUseTemplate } from "@/lib/subscription";

const bodySchema = z.object({
  resumeId: z.string().optional(),
  contentJson: z.string().optional(),
  templateId: z.string().default("classic"),
  name: z.string().default(""),
  title: z.string().optional(),
});

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const { templateId, name, title } = parsed.data;
    if (!canUseTemplate(session.user.tier, templateId)) {
      return NextResponse.json({ error: "Template requires Pro subscription" }, { status: 403 });
    }

    let contentJson = parsed.data.contentJson ?? "{}";
    if (parsed.data.resumeId) {
      const row = await prisma.resume.findFirst({
        where: { id: parsed.data.resumeId, userId: session.user.id },
      });
      if (!row) {
        return NextResponse.json({ error: "Resume not found" }, { status: 404 });
      }
      contentJson = row.contentJson;
    }

    const content = parseResumeContent(contentJson);
    const html = buildResumeHtmlDocument({
      content,
      templateId,
      name: name || session.user.name || "Candidate",
      title,
    });

    const pdf = await htmlToPdfBuffer(html);

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="careerforge-resume.pdf"',
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "PDF generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
