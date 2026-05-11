import type { Metadata } from "next";
import { DM_Sans, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const dm = DM_Sans({ subsets: ["latin"], variable: "--font-display" });

const criticalAuthCss = `
body{margin:0;background:#020617;color:#f8fafc;font-family:var(--font-sans),system-ui,sans-serif}
.auth-page{min-height:100vh;background:radial-gradient(circle at 12% 18%,rgba(12,140,228,.24),transparent 30%),radial-gradient(circle at 86% 8%,rgba(16,185,129,.18),transparent 28%),linear-gradient(135deg,#07111f 0%,#0f172a 48%,#f8fafc 48%,#eef2ff 100%);color:#f8fafc}
.auth-shell{margin:0 auto;display:grid;min-height:100vh;width:100%;max-width:1180px;grid-template-columns:minmax(0,.94fr) minmax(360px,.76fr);gap:28px;padding:32px;box-sizing:border-box}
.auth-brand{display:inline-flex;width:fit-content;align-items:center;gap:12px;color:inherit;font-size:15px;font-weight:800;letter-spacing:-.02em;text-decoration:none}.auth-logo{display:grid;height:42px;width:42px;place-items:center;border-radius:12px;background:linear-gradient(135deg,#0c8ce4,#10b981);color:#fff;box-shadow:0 18px 40px rgba(12,140,228,.28)}
.auth-copy{display:flex;min-height:100%;flex-direction:column;justify-content:space-between;gap:40px;padding:22px 0}.auth-eyebrow{margin:0 0 14px;color:#86efac;font-size:14px;font-weight:800}.auth-title{margin:0;max-width:640px;color:#fff;font-family:var(--font-display),system-ui,sans-serif;font-size:clamp(42px,6vw,76px);font-weight:800;letter-spacing:-.03em;line-height:.94}.auth-description{margin:22px 0 0;max-width:560px;color:#cbd5e1;font-size:17px;line-height:1.7}
.auth-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:22px}.auth-stat,.auth-preview-row{border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(255,255,255,.08);box-shadow:0 20px 60px rgba(0,0,0,.22);backdrop-filter:blur(16px)}.auth-stat{padding:14px}.auth-stat strong{display:block;color:#fff;font-size:16px}.auth-stat span{color:#cbd5e1;font-size:12px}.auth-preview{display:grid;gap:12px;max-width:560px}.auth-preview-row{display:flex;align-items:center;gap:14px;padding:15px}.auth-preview-index{display:grid;height:34px;width:34px;flex:0 0 auto;place-items:center;border-radius:10px;background:#fff;color:#0f172a;font-size:13px;font-weight:900}.auth-preview-row span:last-child{color:#e2e8f0;font-size:14px;font-weight:700}
.auth-panel{align-self:center;border:1px solid rgba(15,23,42,.1);border-radius:24px;background:rgba(255,255,255,.94);color:#0f172a;box-shadow:0 30px 90px rgba(15,23,42,.22);overflow:hidden}.auth-panel-inner{padding:34px}.auth-panel-kicker{margin:0;color:#006fc4;font-size:13px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.auth-panel-title{margin:12px 0 0;color:#0f172a;font-family:var(--font-display),system-ui,sans-serif;font-size:34px;font-weight:800;letter-spacing:-.03em}.auth-panel-text{margin:10px 0 0;color:#64748b;font-size:15px;line-height:1.6}
.auth-form{margin-top:28px;display:grid;gap:18px}.auth-field label,.auth-field-row label{color:#334155;font-size:13px;font-weight:800}.auth-field-row{display:flex;align-items:center;justify-content:space-between;gap:12px}.auth-input{margin-top:8px;width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:12px;background:#fff;color:#0f172a;font-size:15px;outline:none;padding:13px 14px}.auth-input:focus{border-color:#0c8ce4;box-shadow:0 0 0 4px rgba(12,140,228,.14)}.auth-button{display:inline-flex;width:100%;align-items:center;justify-content:center;border:0;border-radius:12px;background:linear-gradient(135deg,#006fc4,#0c8ce4);color:#fff;cursor:pointer;font-weight:900;min-height:48px;padding:13px 18px;box-shadow:0 16px 32px rgba(0,111,196,.28)}.auth-button:disabled{cursor:not-allowed;opacity:.56}.auth-link-button{border:0;background:transparent;color:#006fc4;cursor:pointer;font-size:12px;font-weight:900;padding:0}.auth-alert{border-radius:12px;padding:12px 14px;font-size:14px;font-weight:700}.auth-alert-error{border:1px solid #fecaca;background:#fef2f2;color:#991b1b}.auth-alert-success{border:1px solid #bbf7d0;background:#f0fdf4;color:#166534}.auth-switch{margin:22px 0 0;color:#64748b;font-size:14px;text-align:center}.auth-switch a{color:#006fc4;font-weight:900}.auth-meter{margin-top:10px;height:8px;overflow:hidden;border-radius:999px;background:#e2e8f0}.auth-meter-fill{height:100%;border-radius:inherit;transition:width .2s,background .2s}.auth-meter-fill.is-weak{width:34%;background:#f59e0b}.auth-meter-fill.is-ready{width:100%;background:#10b981}.auth-note{margin:8px 0 0;color:#64748b;font-size:12px}
@media (max-width:920px){.auth-page{background:linear-gradient(180deg,#07111f 0%,#0f172a 46%,#f8fafc 46%,#eef2ff 100%)}.auth-shell{grid-template-columns:1fr;gap:22px;padding:22px}.auth-copy{min-height:auto;gap:24px;padding:0}.auth-title{font-size:clamp(36px,11vw,54px)}.auth-preview{display:none}.auth-panel{align-self:stretch}}@media (max-width:520px){.auth-shell{padding:16px}.auth-panel-inner{padding:24px}.auth-panel-title{font-size:28px}.auth-stats{grid-template-columns:1fr}}
`;

export const metadata: Metadata = {
  title: "CareerForge Pro — ATS Resume & Job Matcher",
  description:
    "Upload your resume, paste a job description, and generate an ATS-optimized PDF with AI-powered rewriting.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${dm.variable}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: criticalAuthCss }} />
      </head>
      <body className="min-h-screen font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
