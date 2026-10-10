import { chromium, devices } from "playwright";

const BASE = process.env.AUDIT_URL || "http://localhost:5174";

async function launch() {
  try {
    return await chromium.launch({ channel: "chrome", headless: true });
  } catch {
    return await chromium.launch({ channel: "msedge", headless: true });
  }
}

const browser = await launch();
const issues = [];

for (const [label, ctxOpts] of [
  ["desktop", { viewport: { width: 1440, height: 900 } }],
  ["mobile", devices["iPhone 13"]],
]) {
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => issues.push(`[${label}] ${e.message}`));

  await page.goto(`${BASE}/experience`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  const companies = new Set();
  if (label === "desktop") {
    const pinTop = await page.evaluate(() => {
      const pin = document.querySelector(".ex-pin");
      return pin ? pin.getBoundingClientRect().top + window.scrollY : 0;
    });
    for (let i = 0; i < 5; i++) {
      const y = pinTop + 200 + i * 450;
      await page.evaluate((t) => window.scrollTo(0, t), y);
      await page.waitForTimeout(350);
      const company = await page.locator(".ex-stage-company").first().innerText();
      companies.add(company.trim());
      const hidden = await page.evaluate(() => {
        const stage = document.querySelector(".ex-stage");
        if (!stage) return 99;
        return Number(getComputedStyle(stage).opacity) < 0.2 ? 1 : 0;
      });
      if (hidden) issues.push(`[desktop] scroll ${i}: stage invisible`);
    }
    if (companies.size < 3) {
      issues.push(`[desktop] pinned scroll showed only: ${[...companies].join(" | ")}`);
    }
  }

  for (let i = 0; i < 5; i++) {
    await page.locator(".ex-dot").nth(i).click();
    await page.waitForTimeout(600);
    const current = await page.locator('.ex-dot[aria-current="true"]').count();
    if (current !== 1) issues.push(`[${label}] dot ${i + 1}: expected one active dot`);
  }

  await ctx.close();
}

await browser.close();

console.log("ISSUES:", issues.length ? issues.join("\n") : "none");
if (issues.length) process.exitCode = 1;
