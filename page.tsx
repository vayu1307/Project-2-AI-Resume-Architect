import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default async function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-forge-950/30">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-16">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-forge-200">
              ATS-Proof Resume Generator &amp; Job Matcher
            </p>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Forge a resume that speaks the language of the job description.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-300">
              CareerForge Pro analyzes your target role, extracts ranked keywords, rewrites your experience with
              precision prompts, and renders a pixel-perfect PDF with headless Chrome — built for real hiring
              workflows.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="btn btn-primary px-6 py-3">
                Start free
              </Link>
              <Link href="/login" className="btn btn-ghost px-6 py-3">
                Sign in
              </Link>
            </div>
            <dl className="mt-12 grid gap-6 sm:grid-cols-3">
              <div className="glass p-4">
                <dt className="text-xs uppercase tracking-wide text-slate-400">JD Analysis Agent</dt>
                <dd className="mt-2 text-sm text-slate-200">
                  Scrapes job pages and semantically ranks ATS-critical keywords.
                </dd>
              </div>
              <div className="glass p-4">
                <dt className="text-xs uppercase tracking-wide text-slate-400">AI rewrite engine</dt>
                <dd className="mt-2 text-sm text-slate-200">
                  Prompt-tuned rewrites that weave keywords into authentic bullets.
                </dd>
              </div>
              <div className="glass p-4">
                <dt className="text-xs uppercase tracking-wide text-slate-400">Puppeteer PDF</dt>
                <dd className="mt-2 text-sm text-slate-200">
                  React resume → professional, non-editable PDF output.
                </dd>
              </div>
            </dl>
          </div>
          <div className="glass relative overflow-hidden p-8">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-forge-500/30 blur-3xl" />
            <h2 className="font-display text-lg font-semibold text-white">Plans</h2>
            <ul className="mt-4 space-y-4 text-sm text-slate-300">
              <li className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Free</span>
                  <span className="text-xs text-slate-400">$0 · 5 analyses/month</span>
                </div>
                <p className="mt-2 text-slate-400">Core ATS workflow, classic template, PDF export.</p>
              </li>
              <li className="rounded-xl border border-forge-500/30 bg-forge-950/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Starter</span>
                  <span className="text-xs text-forge-200">$9.99 · 100/year</span>
                </div>
                <p className="mt-2 text-slate-300">
                  Paid plan with 100 analyses per year, cover letters, and premium templates.
                </p>
              </li>
              <li className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Unlimited</span>
                  <span className="text-xs text-amber-200">$100 · 2 years</span>
                </div>
                <p className="mt-2 text-slate-300">
                  Unlimited analyses for two years with all premium features.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
