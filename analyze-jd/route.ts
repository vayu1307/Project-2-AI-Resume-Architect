import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeJobDescription, fetchJobDescriptionFromUrl, keywordsToItems } from "@/lib/jd-agent";

const bodySchema = z.object({
  jdText: z.string().optional(),
  jdUrl: z.string().url().optional(),
});

export const runtime = "nodejs";
export const maxDuration = 60;

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
    let jdText = parsed.data.jdText?.trim() ?? "";
    if (parsed.data.jdUrl) {
      const fetched = await fetchJobDescriptionFromUrl(parsed.data.jdUrl);
      jdText = jdText ? `${jdText}\n\n${fetched}` : fetched;
    }
    if (jdText.length < 40) {
      return NextResponse.json({ error: "Job description is too short" }, { status: 400 });
    }

    const analysis = await analyzeJobDescription(jdText);
    const keywords = keywordsToItems(analysis);

    return NextResponse.json({
      analysis,
      keywords,
      jdTextUsed: jdText.slice(0, 24000),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
