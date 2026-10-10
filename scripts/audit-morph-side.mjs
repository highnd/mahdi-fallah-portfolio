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

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

const debug = await page.evaluate(() => window.__nebMorph);
console.log("morph debug:", JSON.stringify(debug, null, 2));

const root = await page.locator(".neb-root");
const span = await page.evaluate(() => {
  const r = document.querySelector(".neb-root");
  return r ? r.offsetHeight - window.innerHeight : 0;
});

// Stations with right-side text: 1, 3, 5
for (const [name, idx] of [
  ["phd-right-text", 1],
  ["stack-right-text", 3],
  ["process-right-text", 5],
  ["hero-left-text", 0],
  ["design-left-text", 4],
]) {
  await page.evaluate(
    ([top]) => window.scrollTo(0, top),
    [(idx / 8) * span],
  );
  await page.waitForTimeout(700);
  await page.screenshot({
    path: `scripts/morph-side-${name}.png`,
    fullPage: false,
  });
  const layout = await page.evaluate(() => {
    const sec = [...document.querySelectorAll(".neb-sec")].find(
      (el) => Number(getComputedStyle(el).opacity) > 0.4,
    );
    if (!sec) return null;
    const copy = sec.querySelector(
      ".neb-hero-copy, .neb-side-copy, .neb-expertise",
    );
    if (!copy) return { className: sec.className };
    const r = copy.getBoundingClientRect();
    return {
      className: sec.className,
      copyMidX: Math.round(r.left + r.width / 2),
      copySide: r.left + r.width / 2 < window.innerWidth / 2 ? "left" : "right",
      vw: window.innerWidth,
    };
  });
  console.log(name, layout);
}

await browser.close();
