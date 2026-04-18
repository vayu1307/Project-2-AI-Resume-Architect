"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
        <Link href="/" className="mb-8 font-display text-lg font-semibold text-white">
          CareerForge <span className="text-forge-400">Pro</span>
        </Link>
        <h1 className="font-display text-2xl font-semibold text-white">Sign in</h1>
        <p className="mt-2 text-sm text-slate-400">Welcome back. Continue to your dashboard.</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
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
            <label className="block text-xs font-medium text-slate-400">Password</label>
            <input
              className="input mt-1"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button type="submit" className="btn btn-primary w-full py-3" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          No account?{" "}
          <Link href="/register" className="text-forge-300 hover:text-forge-200">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
