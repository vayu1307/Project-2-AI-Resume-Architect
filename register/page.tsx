"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Could not register");
      return;
    }
    router.push("/login?registered=1");
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
        <Link href="/" className="mb-8 font-display text-lg font-semibold text-white">
          CareerForge <span className="text-forge-400">Pro</span>
        </Link>
        <h1 className="font-display text-2xl font-semibold text-white">Create account</h1>
        <p className="mt-2 text-sm text-slate-400">Free tier includes one saved resume and PDF export.</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400">Name (optional)</label>
            <input
              className="input mt-1"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400">Email</label>
            <input
              className="input mt-1"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400">Password (min 8 characters)</label>
            <input
              className="input mt-1"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button type="submit" className="btn btn-primary w-full py-3" disabled={loading}>
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-forge-300 hover:text-forge-200">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}