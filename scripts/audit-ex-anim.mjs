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

const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

await page.goto(`${BASE}/experience`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);

const report = [];

async function sample(label) {
  const data = await page.evaluate(() => {
    const stations = [...document.querySelectorAll(".ex-station")].map((s, i) => {
      const reveals = [...s.querySelectorAll(".ex-reveal")].map((el) => {
        const cs = getComputedStyle(el);
        return {
          opacity: cs.opacity,
          transform: cs.transform,
          text: (el.textContent || "").trim().slice(0, 40),
        };
      });
      return {
        i,
        active: s.getAttribute("data-active"),
        company: s.querySelector(".ex-company")?.textContent?.trim(),
        reveals,
        hiddenCount: reveals.filter((r) => Number(r.opacity) < 0.1).length,
      };
    });
    const fill = document.querySelector(".ex-nav-fill");
    const fillT = fill ? getComputedStyle(fill).transform : null;
    const activeDot = document.querySelector('.ex-dot[aria-current="true"]')?.textContent;
    return {
      scrollY: window.scrollY,
      activeDot,
      fillT,
      stations,
    };
  });
  report.push({ label, ...data });
}

await sample("top");

for (const y of [700, 1400, 2100, 2800, 3600]) {
  await page.evaluate((t) => window.scrollTo(0, t), y);
  await page.waitForTimeout(600);
  await sample(`scroll-${y}`);
}

console.log(JSON.stringify({ errors, report }, null, 2));
await browser.close();

const broken = report.some((r) =>
  r.stations.some((s) => s.active === "true" && s.hiddenCount > 0),
);
if (broken || errors.length) process.exitCode = 1;
