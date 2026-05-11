"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

const workflowSteps = [
  "Analyze a target job description",
  "Rewrite bullets with ranked keywords",
  "Export a recruiter-ready PDF",
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const registered = searchParams.get("registered") === "1";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password. Check your details and try again.");
      return;
    }

    router.push(res?.url || callbackUrl);
    router.refresh();
  }

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <section className="auth-copy">
          <Link href="/" className="auth-brand">
            <span className="auth-logo">CF</span>
            <span>CareerForge Pro</span>
          </Link>

          <div>
            <p className="auth-eyebrow">Workspace login</p>
            <h1 className="auth-title">Resume work that feels like a real product.</h1>
            <p className="auth-description">
              Sign in to continue analyzing jobs, rewriting resume bullets, scoring ATS fit, and exporting clean PDFs
              from one focused dashboard.
            </p>

            <div className="auth-stats">
              <div className="auth-stat">
                <strong>92%</strong>
                <span>sample ATS match</span>
              </div>
              <div className="auth-stat">
                <strong>5/mo</strong>
                <span>free analyses</span>
              </div>
              <div className="auth-stat">
                <strong>PDF</strong>
                <span>export ready</span>
              </div>
            </div>
          </div>

          <div className="auth-preview">
            {workflowSteps.map((step, index) => (
              <div key={step} className="auth-preview-row">
                <span className="auth-preview-index">{index + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="auth-panel" aria-label="Sign in">
          <div className="auth-panel-inner">
            <p className="auth-panel-kicker">Secure access</p>
            <h2 className="auth-panel-title">Welcome back</h2>
            <p className="auth-panel-text">Use your account email and password to open your dashboard.</p>

            {registered ? (
              <div className="auth-alert auth-alert-success" style={{ marginTop: 20 }}>
                Account created. Sign in to open your workspace.
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="auth-form">
              <div className="auth-field">
                <label htmlFor="email">Work email</label>
                <input
                  id="email"
                  className="auth-input"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="auth-field">
                <div className="auth-field-row">
                  <label htmlFor="password">Password</label>
                  <button type="button" className="auth-link-button" onClick={() => setShowPassword((value) => !value)}>
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <input
                  id="password"
                  className="auth-input"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error ? <div className="auth-alert auth-alert-error">{error}</div> : null}

              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? "Signing in..." : "Sign in to dashboard"}
              </button>
            </form>

            <p className="auth-switch">
              New to CareerForge? <Link href="/register">Start free</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="auth-page">
          <div className="auth-shell">
            <section className="auth-copy">
              <span className="auth-brand">
                <span className="auth-logo">CF</span>
                <span>CareerForge Pro</span>
              </span>
              <h1 className="auth-title">Loading workspace...</h1>
            </section>
            <section className="auth-panel">
              <div className="auth-panel-inner">
                <p className="auth-panel-kicker">Secure access</p>
                <h2 className="auth-panel-title">Loading</h2>
              </div>
            </section>
          </div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
