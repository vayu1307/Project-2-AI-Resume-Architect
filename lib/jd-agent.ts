import { z } from "zod";
import * as cheerio from "cheerio";
import { getOpenAI } from "./openai-client";
import type { KeywordItem } from "@/types/resume";

const analysisSchema = z.object({
  keywords: z.array(
    z.object({
      term: z.string(),
      weight: z.number().min(0).max(100),
      category: z.string(),
    }),
  ),
  roleSummary: z.string(),
  mustHaveSkills: z.array(z.string()),
});

export type JdAnalysis = z.infer<typeof analysisSchema>;

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "you",
  "your",
  "this",
  "that",
  "from",
  "will",
  "are",
  "our",
  "have",
  "has",
  "their",
  "they",
  "all",
  "not",
  "any",
  "can",
  "into",
  "using",
  "use",
  "job",
  "role",
  "team",
  "work",
  "years",
  "year",
  "experience",
  "required",
  "preferred",
  "skills",
  "ability",
  "strong",
  "knowledge",
  "including",
  "plus",
]);

export async function fetchJobDescriptionFromUrl(url: string): Promise<string> {
  const u = new URL(url);
  if (!["http:", "https:"].includes(u.protocol)) {
    throw new Error("Only http(s) URLs are allowed");
  }
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; CareerForgePro/1.0; +https://careerforge.pro)",
      Accept: "text/html,application/xhtml+xml",
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch URL (${res.status})`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);
  $("script, style, nav, footer, header").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim();
  if (text.length < 80) {
    throw new Error("Could not extract enough text from the page");
  }
  return text.slice(0, 24000);
}

export async function analyzeJobDescription(jdText: string): Promise<JdAnalysis> {
  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are the CareerForge Pro JD Analysis Agent. Parse the job description and return JSON only:
{
  "keywords": [ { "term": string, "weight": 0-100, "category": "technical"|"soft"|"domain"|"tool"|"certification"|"other" } ],
  "roleSummary": "one paragraph",
  "mustHaveSkills": [ "..." ]
}
Rank keywords by ATS importance (tools, stack, methodologies, leadership terms). Include 12-28 distinct keywords.`,
        },
        {
          role: "user",
          content: jdText.slice(0, 20000),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("No analysis from model");
    const parsed = JSON.parse(raw);
    return analysisSchema.parse(parsed);
  } catch {
    // Fallback mode: keep product usable when OpenAI is unavailable/quota-limited.
    return analyzeJobDescriptionFallback(jdText);
  }
}

export function keywordsToItems(analysis: JdAnalysis): KeywordItem[] {
  return analysis.keywords.map((k) => ({
    term: k.term,
    weight: k.weight,
    category: k.category,
  }));
}

function analyzeJobDescriptionFallback(jdText: string): JdAnalysis {
  const clean = jdText.replace(/\s+/g, " ").trim();
  const tokens = clean.toLowerCase().match(/[a-z][a-z0-9+#.\-/]{1,24}/g) ?? [];
  const counts = new Map<string, number>();

  for (const token of tokens) {
    if (STOP_WORDS.has(token)) continue;
    if (token.length < 3) continue;
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  const sorted = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 22);

  const max = sorted[0]?.[1] ?? 1;
  const keywords = sorted.map(([term, count]) => ({
    term,
    weight: Math.max(35, Math.min(95, Math.round((count / max) * 95))),
    category: inferCategory(term),
  }));

  const mustHaveSkills = keywords.slice(0, 10).map((k) => k.term);
  const summarySeed = clean.slice(0, 380);
  const roleSummary = summarySeed
    ? `Auto-derived summary (fallback mode): ${summarySeed}${clean.length > 380 ? "..." : ""}`
    : "Auto-derived summary (fallback mode): Role details extracted from provided job description.";

  return {
    keywords,
    roleSummary,
    mustHaveSkills,
  };
}

function inferCategory(term: string): string {
  if (/(python|java|javascript|typescript|react|node|sql|aws|azure|gcp|docker|kubernetes|api|agile|scrum)/i.test(term)) {
    return "technical";
  }
  if (/(leadership|communication|collaboration|stakeholder|mentoring|ownership)/i.test(term)) {
    return "soft";
  }
  if (/(jira|excel|tableau|powerbi|git|jenkins|snowflake|salesforce)/i.test(term)) {
    return "tool";
  }
  return "domain";
}
