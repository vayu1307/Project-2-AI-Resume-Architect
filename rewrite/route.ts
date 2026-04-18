import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { JdAnalysis } from "@/lib/jd-agent";
import { rewriteResumeForJd } from "@/lib/rewrite-resume";
import { computeAtsScore, resumeToPlainText } from "@/lib/ats-score";

const bodySchema = z.object({
  rawResumeText: z.string().min(20),
  analysis: z.custom<JdAnalysis>(),
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

    const content = await rewriteResumeForJd(parsed.data.rawResumeText, parsed.data.analysis);
    const plain = resumeToPlainText({
      summary: content.summary,
      experience: content.experience.map((e) => ({
        company: e.company,
        role: e.role,
        bullets: e.bullets,
      })),
      education: content.education.map((ed) => ({ school: ed.school, degree: ed.degree })),
      skills: content.skills,
    });

    const keywords = (parsed.data.analysis.keywords || []).map((k) => ({
      term: k.term,
      weight: k.weight,
      category: k.category,
    }));

    const atsScore = computeAtsScore(plain, keywords);

    return NextResponse.json({
      content,
      atsScore,
      contentJson: JSON.stringify(content),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Rewrite failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
