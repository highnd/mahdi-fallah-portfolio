import { chromium } from "playwright";

const BASE = process.env.AUDIT_URL || "http://localhost:5174";

async function launch() {
  try {
    return await chromium.launch({ channel: "chrome", headless: true });
  } catch {
    return await chromium.launch({ channel: "msedge", headless: true });
  }
}

const browser = await launch();
const page = await (
  await browser.newContext({ viewport: { width: 1440, height: 900 } })
).newPage();

await page.goto(`${BASE}/experience`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);

const jumps = [];
for (const y of [400, 800, 1200, 1600, 2200, 3000]) {
  await page.evaluate((t) => window.scrollTo(0, t), y);
  await page.waitForTimeout(180);
  const now = await page.evaluate(() => window.scrollY);
  if (Math.abs(now - y) > 100) jumps.push({ target: y, actual: now });
}

const imgs = await page.$$eval(".ex-media img", (els) =>
  els.map((e) => ({
    src: e.getAttribute("src"),
    w: e.naturalWidth,
    complete: e.complete,
  })),
);

const activeSeq = [];
for (const y of [1000, 1800, 2600, 3400, 4200]) {
  await page.evaluate((t) => window.scrollTo(0, t), y);
  await page.waitForTimeout(400);
  const company = await page
    .locator('.ex-station[data-active="true"] .ex-company')
    .innerText();
  activeSeq.push(company.trim());
}

await page.screenshot({ path: "scripts/ex-fixed-desktop.png" });
await browser.close();

console.log(JSON.stringify({ jumps, imgs, activeSeq }, null, 2));
if (jumps.length) process.exitCode = 1;
if (imgs.some((i) => !i.w)) process.exitCode = 1;
