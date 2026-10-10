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
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto(`${BASE}/experience`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);

await page.screenshot({ path: "scripts/ex-view-top.png" });

// Scroll into pin and through stations
for (const [i, y] of [900, 1800, 2700, 3600, 4500].entries()) {
  await page.evaluate((top) => window.scrollTo(0, top), y);
  await page.waitForTimeout(450);
  const company = await page.locator(".ex-stage-company").first().innerText();
  const current = await page.locator('.ex-dot[aria-current="true"]').innerText();
  console.log(`scroll=${y} company=${company.trim()} activeDot=${current.trim()}`);
  await page.screenshot({ path: `scripts/ex-view-scroll-${i}.png` });
}

const mobile = await browser.newContext({ ...devices["iPhone 13"] });
const m = await mobile.newPage();
await m.goto(`${BASE}/experience`, { waitUntil: "networkidle" });
await m.waitForTimeout(500);
await m.evaluate(() => window.scrollTo(0, 700));
await m.waitForTimeout(400);
await m.screenshot({ path: "scripts/ex-view-mobile.png" });

await browser.close();
console.log("viewport audit done");
