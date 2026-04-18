"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { JdAnalysis } from "@/lib/jd-agent";
import type { KeywordItem, ResumeContent } from "@/types/resume";
import { emptyResumeContent } from "@/types/resume";

type Props = {
  initialTier: "FREE" | "PRO";
};

export function ResumeStudio({ initialTier }: Props) {
  const { data: session, update } = useSession();
  const tier = (session?.user?.tier as "FREE" | "PRO" | undefined) ?? initialTier;

  const [title, setTitle] = useState("Target role resume");
  const [rawResumeText, setRawResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [jdUrl, setJdUrl] = useState("");
  const [analysis, setAnalysis] = useState<JdAnalysis | null>(null);
  const [keywords, setKeywords] = useState<KeywordItem[]>([]);
  const [content, setContent] = useState<ResumeContent>(emptyResumeContent());
  const [atsScore, setAtsScore] = useState(0);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState("classic");
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [savedList, setSavedList] = useState<{ id: string; title: string; atsScore: number }[]>([]);

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshList = useCallback(async () => {
    const res = await fetch("/api/resumes");
    if (!res.ok) return;
    const data = await res.json();
    setSavedList(data.resumes ?? []);
  }, []);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  async function onUploadFile(file: File) {
    setBusy("parse");
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/parse-resume", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Parse failed");
      setRawResumeText(data.text ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  }

  async function runAnalyze() {
    setBusy("analyze");
    setError(null);
    try {
      const res = await fetch("/api/analyze-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jdText,
          jdUrl: jdUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setAnalysis(data.analysis);
      setKeywords(data.keywords ?? []);
      if (typeof data.jdTextUsed === "string" && !jdText.trim()) {
        setJdText(data.jdTextUsed.slice(0, 8000));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setBusy(null);
    }
  }

  async function runRewrite() {
    if (!analysis) {
      setError("Run JD analysis first.");
      return;
    }
    if (rawResumeText.trim().length < 20) {
      setError("Paste or upload a resume with enough text to rewrite.");
      return;
    }
    setBusy("rewrite");
    setError(null);
    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawResumeText, analysis }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rewrite failed");
      setContent(data.content);
      setAtsScore(data.atsScore ?? 0);
      setCoverLetter(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rewrite failed");
    } finally {
      setBusy(null);
    }
  }

  async function saveResume() {
    setBusy("save");
    setError(null);
    try {
      const payload = {
        title,
        rawText: rawResumeText,
        jdText,
        jdUrl: jdUrl || undefined,
        keywords: JSON.stringify(keywords),
        atsScore,
        contentJson: JSON.stringify(content),
        coverLetter: coverLetter ?? undefined,
        templateId,
      };
      if (resumeId) {
        const res = await fetch(`/api/resumes/${resumeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Save failed");
      } else {
        const res = await fetch("/api/resumes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Save failed");
        setResumeId(data.resume?.id ?? null);
      }
      await refreshList();
      await update();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  async function downloadPdf() {
    setBusy("pdf");
    setError(null);
    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: resumeId ?? undefined,
          contentJson: JSON.stringify(content),
          templateId,
          name: session?.user?.name || "Candidate",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "PDF failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "careerforge-resume.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF failed");
    } finally {
      setBusy(null);
    }
  }

  async function runCoverLetter() {
    if (!analysis) {
      setError("Analyze the JD first.");
      return;
    }
    setBusy("cover");
    setError(null);
    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentJson: JSON.stringify(content),
          analysis,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cover letter failed");
      setCoverLetter(data.coverLetter ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cover letter failed");
    } finally {
      setBusy(null);
    }
  }

  async function checkoutPro() {
    setBusy("stripe");
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      if (data.url) window.location.href = data.url as string;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setBusy(null);
    }
  }

  const loadResume = useCallback(async (id: string) => {
    setBusy("load");
    setError(null);
    try {
      const res = await fetch(`/api/resumes/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Load failed");
      const r = data.resume;
      setResumeId(r.id);
      setTitle(r.title);
      setRawResumeText(r.rawText ?? "");
      setJdText(r.jdText ?? "");
      setJdUrl(r.jdUrl ?? "");
      setAtsScore(r.atsScore ?? 0);
      setTemplateId(r.templateId ?? "classic");
      setCoverLetter(r.coverLetter ?? null);
      try {
        const kw = JSON.parse(r.keywords || "[]");
        if (Array.isArray(kw)) setKeywords(kw);
      } catch {
        setKeywords([]);
      }
      try {
        const c = JSON.parse(r.contentJson || "{}");
        setContent({
          summary: c.summary ?? "",
          experience: c.experience ?? [],
          education: c.education ?? [],
          skills: c.skills ?? [],
        });
      } catch {
        setContent(emptyResumeContent());
      }
      setAnalysis(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setBusy(null);
    }
  }, []);

  const keywordPreview = useMemo(() => keywords.slice(0, 18), [keywords]);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        <section className="glass p-6">
          <h2 className="font-display text-lg font-semibold text-white">1. Resume source</h2>
          <p className="mt-1 text-sm text-slate-400">
            Paste text or upload a <code className="text-forge-300">.txt</code> /{" "}
            <code className="text-forge-300">.pdf</code> resume.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <label className="btn btn-ghost cursor-pointer">
              Upload file
              <input
                type="file"
                accept=".pdf,.txt"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onUploadFile(f);
                }}
              />
            </label>
          </div>
          <textarea
            className="input mt-4 min-h-[200px] font-mono text-xs leading-relaxed"
            placeholder="Paste your resume text…"
            value={rawResumeText}
            onChange={(e) => setRawResumeText(e.target.value)}
          />
        </section>

        <section className="glass p-6">
          <h2 className="font-display text-lg font-semibold text-white">2. Job description</h2>
          <p className="mt-1 text-sm text-slate-400">
            Paste the JD and optionally add a public posting URL for the JD Analysis Agent.
          </p>
          <input
            className="input mt-4"
            placeholder="https://company.com/careers/…"
            value={jdUrl}
            onChange={(e) => setJdUrl(e.target.value)}
          />
          <textarea
            className="input mt-3 min-h-[160px]"
            placeholder="Paste the full job description…"
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className="btn btn-primary" onClick={() => void runAnalyze()} disabled={!!busy}>
              {busy === "analyze" ? "Analyzing…" : "Run JD analysis"}
            </button>
          </div>
        </section>

        <section className="glass p-6">
          <h2 className="font-display text-lg font-semibold text-white">3. AI rewrite &amp; ATS score</h2>
          <p className="mt-1 text-sm text-slate-400">
            Rewrites your experience to align with extracted keywords while keeping claims grounded in your source
            resume.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className="btn btn-primary" onClick={() => void runRewrite()} disabled={!!busy}>
              {busy === "rewrite" ? "Rewriting…" : "Rewrite resume for this JD"}
            </button>
          </div>
          {analysis ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/50 p-4 text-sm text-slate-300">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role summary</p>
              <p className="mt-2">{analysis.roleSummary}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Top keywords</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {keywordPreview.map((k, idx) => (
                  <span key={`${k.term}-${idx}`} className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-forge-200">
                    {k.term}
                    <span className="text-slate-500"> · {k.weight}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="glass p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-white">Optimized output</h2>
              <p className="mt-1 text-sm text-slate-400">
                ATS match score:{" "}
                <span className="font-semibold text-forge-300">{atsScore}%</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                className="input max-w-xs"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Resume title"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-400">Template</label>
              <select
                className="input mt-1"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                <option value="classic">Classic (free)</option>
                <option value="minimal">Minimal (free)</option>
                <option value="premium" disabled={tier !== "PRO"}>
                  Premium (Pro)
                </option>
                <option value="executive" disabled={tier !== "PRO"}>
                  Executive (Pro)
                </option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button type="button" className="btn btn-primary" onClick={() => void saveResume()} disabled={!!busy}>
                {busy === "save" ? "Saving…" : "Save resume"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => void downloadPdf()} disabled={!!busy}>
                {busy === "pdf" ? "PDF…" : "Download PDF"}
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/40 p-4 text-sm text-slate-200">
            <p className="text-xs uppercase tracking-wide text-slate-500">Summary</p>
            <p className="mt-2 whitespace-pre-wrap">{content.summary || "—"}</p>
            <p className="mt-4 text-xs uppercase tracking-wide text-slate-500">Experience</p>
            <ul className="mt-2 space-y-3">
              {content.experience.map((job, i) => (
                <li key={i}>
                  <div className="font-semibold text-white">
                    {job.role} · {job.company}
                  </div>
                  <div className="text-xs text-slate-500">{job.dates}</div>
                  <ul className="mt-1 list-disc pl-5 text-slate-300">
                    {job.bullets.map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
            {content.education.length > 0 ? (
              <>
                <p className="mt-4 text-xs uppercase tracking-wide text-slate-500">Education</p>
                <ul className="mt-2 space-y-2">
                  {content.education.map((ed, i) => (
                    <li key={i} className="text-slate-200">
                      <span className="font-medium">{ed.school}</span> — {ed.degree}{" "}
                      <span className="text-slate-500">({ed.dates})</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            {content.skills.length > 0 ? (
              <>
                <p className="mt-4 text-xs uppercase tracking-wide text-slate-500">Skills</p>
                <p className="mt-2 text-slate-300">{content.skills.join(" · ")}</p>
              </>
            ) : null}
          </div>

          {tier === "PRO" ? (
            <div className="mt-6 border-t border-white/10 pt-6">
              <h3 className="text-sm font-semibold text-white">Cover letter (Pro)</h3>
              <button
                type="button"
                className="btn btn-ghost mt-3"
                onClick={() => void runCoverLetter()}
                disabled={!!busy}
              >
                {busy === "cover" ? "Generating…" : "Generate cover letter"}
              </button>
              {coverLetter ? (
                <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-200">
                  {coverLetter}
                </pre>
              ) : null}
            </div>
          ) : null}
        </section>

        {error ? (
          <div className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}
      </div>

      <aside className="space-y-6">
        <div className="glass p-5">
          <h3 className="font-display text-sm font-semibold text-white">Account</h3>
          <p className="mt-2 text-sm text-slate-400">
            Plan: <span className="text-white">{tier}</span>
          </p>
          {tier === "FREE" ? (
            <button type="button" className="btn btn-primary mt-4 w-full" onClick={() => void checkoutPro()} disabled={!!busy}>
              {busy === "stripe" ? "Redirecting…" : "Upgrade to Pro"}
            </button>
          ) : (
            <p className="mt-4 text-xs text-slate-500">Pro includes unlimited resumes, cover letters, and premium templates.</p>
          )}
        </div>

        <div className="glass p-5">
          <h3 className="font-display text-sm font-semibold text-white">Saved resumes</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {savedList.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="w-full rounded-lg border border-white/5 bg-slate-900/40 px-3 py-2 text-left text-slate-200 hover:border-forge-500/40"
                  onClick={() => void loadResume(r.id)}
                >
                  <div className="font-medium">{r.title}</div>
                  <div className="text-xs text-slate-500">ATS {r.atsScore}%</div>
                </button>
              </li>
            ))}
            {savedList.length === 0 ? <li className="text-slate-500">No saved resumes yet.</li> : null}
          </ul>
        </div>

        <div className="glass p-5 text-xs leading-relaxed text-slate-500">
          PDFs are rendered with Puppeteer (headless Chrome) from the same React resume layout used in-app, producing
          consistent, professional output suitable for ATS and human review.
        </div>
      </aside>
    </div>
  );
}
