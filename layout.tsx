import type { Metadata } from "next";
import { DM_Sans, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const dm = DM_Sans({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "CareerForge Pro — ATS Resume & Job Matcher",
  description:
    "Upload your resume, paste a job description, and generate an ATS-optimized PDF with AI-powered rewriting.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${dm.variable}`}>
      <body className="min-h-screen font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
