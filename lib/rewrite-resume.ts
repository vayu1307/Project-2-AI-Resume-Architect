import { z } from "zod";
import { getOpenAI } from "./openai-client";
import type { JdAnalysis } from "./jd-agent";
import type { ResumeContent } from "@/types/resume";
import { emptyResumeContent, resumeContentSchema } from "@/types/resume";

const rewriteEnvelopeSchema = z.object({
  resume: resumeContentSchema,
});

export async function rewriteResumeForJd(
  rawResumeText: string,
  analysis: JdAnalysis,
): Promise<ResumeContent> {
  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are CareerForge Pro's resume editor. Rewrite the candidate's resume to align with the job while staying truthful.
Rules:
- Output JSON only: { "resume": { "summary", "experience", "education", "skills" } } matching the schema.
- "experience" entries need company, role, dates, bullets (3-6 bullets each where possible).
- Naturally weave in must-have skills and top keywords from the analysis where they fit the user's background; do not invent employers, degrees, or dates.
- Use strong action verbs; quantify impact when plausible from context.
- If the raw resume is sparse, infer reasonable professional wording but mark nothing as fact unless supported.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            rawResumeText: rawResumeText.slice(0, 16000),
            jdRoleSummary: analysis.roleSummary,
            mustHaveSkills: analysis.mustHaveSkills,
            rankedKeywords: analysis.keywords.slice(0, 40),
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return buildFallbackResume(rawResumeText, analysis);
    try {
      const parsed = JSON.parse(raw);
      const env = rewriteEnvelopeSchema.safeParse(parsed);
      return env.success ? env.data.resume : buildFallbackResume(rawResumeText, analysis);
    } catch {
      return buildFallbackResume(rawResumeText, analysis);
    }
  } catch {
    // Fallback mode: heuristic rewrite when model quota/API is unavailable.
    return buildFallbackResume(rawResumeText, analysis);
  }
}

export async function generateCoverLetter(
  resume: ResumeContent,
  analysis: JdAnalysis,
  companyHint?: string,
): Promise<string> {
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.45,
    messages: [
      {
        role: "system",
        content:
          "Write a concise professional cover letter (3-4 paragraphs) tailored to the role. No placeholders like [Your Name].",
      },
      {
        role: "user",
        content: JSON.stringify({
          companyHint: companyHint ?? "",
          roleSummary: analysis.roleSummary,
          mustHaveSkills: analysis.mustHaveSkills,
          resumeHighlights: resume,
        }),
      },
    ],
  });
  return completion.choices[0]?.message?.content?.trim() ?? "";
}

function buildFallbackResume(rawResumeText: string, analysis: JdAnalysis): ResumeContent {
  const lines = rawResumeText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const roleLine = lines.find((line) => /\b(engineer|developer|manager|analyst|consultant|specialist|lead)\b/i.test(line)) ?? "Professional Experience";
  const companyLine = lines.find((line) => /\b(inc|llc|ltd|corp|technologies|solutions|systems)\b/i.test(line)) ?? "Current/Recent Employer";
  const educationLine = lines.find((line) => /\b(bachelor|master|b\.?tech|m\.?tech|mba|university|college)\b/i.test(line)) ?? "";

  const candidateBullets = lines
    .filter((line) => /^[-*•]/.test(line) || line.length > 40)
    .slice(0, 5)
    .map((line) => line.replace(/^[-*•]\s*/, ""));

  const keywordTerms = analysis.keywords.slice(0, 8).map((k) => k.term);
  const mustHave = analysis.mustHaveSkills.slice(0, 6);
  const skillSet = [...new Set([...mustHave, ...keywordTerms])].slice(0, 16);

  const fallbackBullets =
    candidateBullets.length > 0
      ? candidateBullets.map((b, idx) => emphasizeKeyword(b, keywordTerms[idx % Math.max(keywordTerms.length, 1)]))
      : [
          `Delivered projects aligned with ${keywordTerms[0] ?? "target role"} requirements and business goals.`,
          `Collaborated across stakeholders to improve delivery quality, reliability, and outcomes.`,
          `Applied ${keywordTerms[1] ?? "industry best practices"} to streamline workflows and execution.`,
        ];

  const summaryCore = lines.slice(0, 2).join(" ").slice(0, 260);
  const summaryKeywords = skillSet.slice(0, 6).join(", ");
  const summary = summaryCore
    ? `${summaryCore}. Focused on ${summaryKeywords}.`
    : `Results-oriented professional aligned to the target role. Core focus: ${summaryKeywords}.`;

  const education = educationLine
    ? [
        {
          school: educationLine,
          degree: "Education details from source resume",
          dates: "As provided",
        },
      ]
    : [];

  return {
    summary,
    experience: [
      {
        company: companyLine,
        role: roleLine,
        dates: "As provided",
        bullets: fallbackBullets,
      },
    ],
    education,
    skills: skillSet,
  };
}

function emphasizeKeyword(text: string, keyword?: string): string {
  if (!keyword) return text;
  if (text.toLowerCase().includes(keyword.toLowerCase())) return text;
  return `${text} (leveraging ${keyword})`;
}
