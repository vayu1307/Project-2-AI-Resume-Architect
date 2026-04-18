import puppeteer from "puppeteer";

export async function htmlToPdfBuffer(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: "0.45in", bottom: "0.45in", left: "0.55in", right: "0.55in" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
