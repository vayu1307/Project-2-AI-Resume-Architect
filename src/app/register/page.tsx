"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const planHighlights = [
  { label: "Free workspace", value: "1 resume" },
  { label: "PDF export", value: "Included" },
  { label: "ATS analyses", value: "5/month" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordReady = password.length >= 8;
  const canSubmit = useMemo(() => email.trim().length > 0 && passwordReady, [email, passwordReady]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: normalizedEmail, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message = typeof data.error === "string" ? data.error : "Could not create your account.";
      const details = [
        typeof data.stage === "string" ? `stage: ${data.stage}` : null,
        typeof data.requestId === "string" ? `request: ${data.requestId}` : null,
      ].filter(Boolean);
      setError(details.length > 0 ? `${message} (${details.join(", ")})` : message);
      setLoading(false);
      return;
    }

    const login = await signIn("credentials", {
      email: normalizedEmail,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    setLoading(false);

    if (login?.error) {
      router.push("/login?registered=1");
      return;
    }

    router.push(login?.url || "/dashboard");
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
            <p className="auth-eyebrow">Start with the free plan</p>
            <h1 className="auth-title">Create your resume workspace in seconds.</h1>
            <p className="auth-description">
              Build a focused SaaS-style workspace for resume parsing, AI rewriting, ATS scoring, cover letters, and
              polished PDF exports.
            </p>
          </div>

          <div className="auth-preview">
            {planHighlights.map((item, index) => (
              <div key={item.label} className="auth-preview-row">
                <span className="auth-preview-index">{index + 1}</span>
                <span>
                  {item.label}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="auth-panel" aria-label="Create account">
          <div className="auth-panel-inner">
            <p className="auth-panel-kicker">New workspace</p>
            <h2 className="auth-panel-title">Get started free</h2>
            <p className="auth-panel-text">No credit card needed. Upgrade later when you need more capacity.</p>

            <form onSubmit={onSubmit} className="auth-form">
              <div className="auth-field">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  className="auth-input"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

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
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
                <div className="auth-meter">
                  <div className={`auth-meter-fill ${passwordReady ? "is-ready" : "is-weak"}`} />
                </div>
                <p className="auth-note">Use 8 or more characters for account security.</p>
              </div>

              {error ? <div className="auth-alert auth-alert-error">{error}</div> : null}

              <button type="submit" className="auth-button" disabled={loading || !canSubmit}>
                {loading ? "Creating workspace..." : "Create workspace"}
              </button>
            </form>

            <p className="auth-switch">
              Already have an account? <Link href="/login">Sign in</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
