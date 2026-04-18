import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateCoverLetter } from "@/lib/rewrite-resume";
import type { JdAnalysis } from "@/lib/jd-agent";
import { parseResumeContent } from "@/types/resume";
import { canGenerateCoverLetter } from "@/lib/subscription";

const bodySchema = z.object({
  contentJson: z.string(),
  analysis: z.custom<JdAnalysis>(),
  companyHint: z.string().optional(),
});

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canGenerateCoverLetter(session.user.tier)) {
    return NextResponse.json(
      { error: "Cover letters are a Pro feature." },
      { status: 403 },
    );
  }

  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const resume = parseResumeContent(parsed.data.contentJson);
    const letter = await generateCoverLetter(
      resume,
      parsed.data.analysis,
      parsed.data.companyHint,
    );

    return NextResponse.json({ coverLetter: letter });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
