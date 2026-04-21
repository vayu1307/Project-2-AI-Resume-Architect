import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ResumeStudio } from "@/components/dashboard/ResumeStudio";
import { SignOutButton } from "@/components/SignOutButton";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const tier = session?.user?.tier ?? "FREE";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-forge-950/20">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="font-display text-lg font-semibold text-white">
            CareerForge <span className="text-forge-400">Pro</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              {session?.user?.email} · <span className="text-slate-200">{tier}</span>
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-display text-3xl font-semibold text-white">Resume studio</h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Upload your resume, analyze a job description, and generate an ATS-aligned PDF with paid-plan cover letters
          and premium templates.
        </p>
        <div className="mt-10">
          <ResumeStudio initialTier={tier} />
        </div>
      </main>
    </div>
  );
}
