import { z } from "zod";

export const resumeContentSchema = z.object({
  summary: z.string(),
  experience: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      dates: z.string(),
      bullets: z.array(z.string()),
    }),
  ),
  education: z.array(
    z.object({
      school: z.string(),
      degree: z.string(),
      dates: z.string(),
    }),
  ),
  skills: z.array(z.string()),
});

export type ResumeContent = z.infer<typeof resumeContentSchema>;

export const keywordItemSchema = z.object({
  term: z.string(),
  weight: z.number().min(0).max(100),
  category: z.string().optional(),
});

export type KeywordItem = z.infer<typeof keywordItemSchema>;

export function emptyResumeContent(): ResumeContent {
  return {
    summary: "",
    experience: [],
    education: [],
    skills: [],
  };
}

export function parseResumeContent(json: string): ResumeContent {
  try {
    const parsed = JSON.parse(json);
    const r = resumeContentSchema.safeParse(parsed);
    return r.success ? r.data : emptyResumeContent();
  } catch {
    return emptyResumeContent();
  }
}
