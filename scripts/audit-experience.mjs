import { chromium, devices } from "playwright";

const BASE = process.env.AUDIT_URL || "http://localhost:5174";
const url = `${BASE}/experience`;

async function audit() {
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome", headless: true });
  } catch {
    try {
      browser = await chromium.launch({ channel: "msedge", headless: true });
    } catch {
      browser = await chromium.launch({ headless: true });
    }
  }
  const issues = [];

  for (const label of ["desktop", "mobile"]) {
    const context = await browser.newContext(
      label === "mobile"
        ? { ...devices["iPhone 13"], locale: "fa-IR" }
        : { viewport: { width: 1440, height: 900 }, locale: "fa-IR" },
    );
    const page = await context.newPage();
    page.on("pageerror", (err) => issues.push(`[${label}] pageerror: ${err.message}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") issues.push(`[${label}] console: ${msg.text()}`);
    });

    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(800);

    const title = await page.locator("h1").first().innerText();
    if (!title.includes("کار")) issues.push(`[${label}] hero title missing Persian copy`);

    const dots = page.locator(".ex-dot");
    const dotCount = await dots.count();
    if (dotCount < 5) issues.push(`[${label}] expected 5 timeline dots, got ${dotCount}`);

    // Click through dots / scroll and ensure active company changes
    const companies = new Set();
    for (let i = 0; i < Math.min(dotCount, 5); i++) {
      await dots.nth(i).click();
      await page.waitForTimeout(500);
      if (label === "desktop") {
        const company = await page.locator(".ex-stage-company").first().innerText();
        companies.add(company.trim());
      } else {
        const active = page.locator('.ex-card[data-active="true"] h3').first();
        if (await active.count()) companies.add((await active.innerText()).trim());
      }
    }

    if (companies.size < 3) {
      issues.push(
        `[${label}] timeline not advancing enough (unique companies: ${[...companies].join(", ")})`,
      );
    }

    // Overflow check
    const overflowX = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
    });
    if (overflowX) issues.push(`[${label}] horizontal overflow detected`);

    await page.screenshot({
      path: `scripts/audit-experience-${label}.png`,
      fullPage: true,
    });

    await context.close();
  }

  await browser.close();

  console.log("URL:", url);
  if (issues.length) {
    console.log("ISSUES:");
    for (const i of issues) console.log("-", i);
    process.exitCode = 1;
  } else {
    console.log("OK: timeline navigation + layout checks passed");
  }
}

audit().catch((err) => {
  console.error(err);
  process.exit(1);
});
