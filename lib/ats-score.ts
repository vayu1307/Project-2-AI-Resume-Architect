import type { KeywordItem } from "@/types/resume";

export function computeAtsScore(resumePlainText: string, keywords: KeywordItem[]): number {
  if (!keywords.length) return 0;
  const lower = resumePlainText.toLowerCase();
  let weighted = 0;
  let totalWeight = 0;
  for (const k of keywords) {
    const w = k.weight || 50;
    totalWeight += w;
    const term = k.term.toLowerCase();
    const variants = [term, term.replace(/[-/]/g, " ")];
    const hit = variants.some((v) => v.length >= 2 && lower.includes(v));
    if (hit) weighted += w;
  }
  if (totalWeight === 0) return 0;
  return Math.round((weighted / totalWeight) * 100);
}

export function resumeToPlainText(parts: {
  summary: string;
  experience: { company: string; role: string; bullets: string[] }[];
  education: { school: string; degree: string }[];
  skills: string[];
}): string {
  const lines: string[] = [parts.summary];
  for (const e of parts.experience) {
    lines.push(e.company, e.role, ...e.bullets);
  }
  for (const ed of parts.education) {
    lines.push(ed.school, ed.degree);
  }
  lines.push(...parts.skills);
  return lines.join(" ");
}
