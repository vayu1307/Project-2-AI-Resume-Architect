import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function SiteHeader() {
  const session = await getServerSession(authOptions);

  return (
    <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight text-white">
          CareerForge <span className="text-forge-400">Pro</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {session ? (
            <>
              <span className="hidden text-slate-400 sm:inline">
                {session.user.tier === "FREE" ? "Free" : "Paid"}
              </span>
              <Link href="/dashboard" className="btn btn-primary px-3 py-2">
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-slate-300 hover:text-white">
                Sign in
              </Link>
              <Link href="/register" className="btn btn-primary px-3 py-2">
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
