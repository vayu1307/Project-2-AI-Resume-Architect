import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  if (name.endsWith(".txt") || file.type === "text/plain") {
    const text = buf.toString("utf8");
    return NextResponse.json({ text: text.slice(0, 64000) });
  }

  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const pdfParse = (await import("pdf-parse")).default as (b: Buffer) => Promise<{ text: string }>;
    const data = await pdfParse(buf);
    const text = (data.text || "").replace(/\s+/g, " ").trim();
    if (!text) {
      return NextResponse.json({ error: "Could not read PDF text" }, { status: 422 });
    }
    return NextResponse.json({ text: text.slice(0, 64000) });
  }

  return NextResponse.json({ error: "Unsupported file type. Use .txt or .pdf" }, { status: 400 });
}
