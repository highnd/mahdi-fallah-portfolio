import { chromium } from "playwright";
import fs from "fs";

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
await page.waitForTimeout(1000);

const span = await page.evaluate(() => {
  const r = document.querySelector(".neb-root");
  return r ? r.offsetHeight - window.innerHeight : 0;
});

const issues = [];
const report = [];

for (let idx = 0; idx < 9; idx++) {
  await page.evaluate(([t]) => window.scrollTo(0, t), [(idx / 8) * span]);
  await page.waitForTimeout(650);

  const info = await page.evaluate(() => {
    const secs = [...document.querySelectorAll(".neb-sec")];
    const active = secs
      .map((el, i) => ({ el, i, op: Number(getComputedStyle(el).opacity) }))
      .sort((a, b) => b.op - a.op)[0];
    if (!active || active.op < 0.2) return { idx: -1, problems: ["no visible section"] };

    const sec = active.el;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const problems = [];
    const boxes = [];

    const copyEls = [
      ...sec.querySelectorAll(
        ".neb-hero-copy, .neb-side-copy, .neb-statement-text, .neb-expertise, .neb-expertise-title, .neb-cols, .neb-team-title, .neb-team-row, .neb-email, .neb-name, .neb-h2, .neb-display, .neb-para, .neb-lead",
      ),
    ];

    for (const el of copyEls) {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const cs = getComputedStyle(el);
      const style = {
        tag: el.tagName,
        cls: el.className?.toString?.().slice(0, 80) || "",
        text: (el.textContent || "").trim().slice(0, 40),
        left: Math.round(r.left),
        right: Math.round(r.right),
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        w: Math.round(r.width),
        h: Math.round(r.height),
        overflowX: cs.overflowX,
        whiteSpace: cs.whiteSpace,
        nowrap: cs.whiteSpace === "nowrap",
      };
      boxes.push(style);

      // clipped by viewport
      if (r.left < -2) problems.push(`CLIP left: ${style.cls || style.tag} (${style.text}) left=${style.left}`);
      if (r.right > vw + 2) problems.push(`CLIP right: ${style.cls || style.tag} (${style.text}) right=${style.right} vw=${vw}`);
      if (r.top < 60 && r.bottom > 80 && style.cls.includes("neb-")) {
        // title under nav ok-ish
      }
      if (r.bottom > vh + 2) problems.push(`CLIP bottom: ${style.cls || style.tag}`);

      // text overflowing its padded dark card
      const card = el.closest(".neb-hero-copy, .neb-side-copy, .neb-statement-text, .neb-cols, .neb-team-row, .neb-email") || el;
      if (card && (card === el || card.contains(el))) {
        const cr = card.getBoundingClientRect();
        // child text wider than card content box
        if (el !== card && r.width > cr.width + 4) {
          problems.push(`OVERFLOW card: ${style.cls || style.text} w=${style.w} > card ${Math.round(cr.width)}`);
        }
        // nowrap titles that stick out of card
        if (style.nowrap && (r.left < cr.left - 2 || r.right > cr.right + 2)) {
          problems.push(`NOWARP cut: ${style.cls || style.text} outside card`);
        }
      }
    }

    // check scrollWidth vs clientWidth on cards
    for (const el of sec.querySelectorAll(".neb-hero-copy, .neb-side-copy, .neb-statement-text, .neb-h2, .neb-display, .neb-expertise-title")) {
      if (el.scrollWidth > el.clientWidth + 2) {
        problems.push(`SCROLL overflow: ${(el.className || "").toString().slice(0, 40)} scroll=${el.scrollWidth} client=${el.clientWidth}`);
      }
    }

    const morph = window.__nebMorph;
    return {
      idx: active.i,
      className: sec.className,
      opacity: active.op,
      problems,
      boxes: boxes.slice(0, 12),
      morphOffX: morph?.offX?.[active.i],
      morphSide: morph?.sides?.[active.i],
      morphPush: morph?.sidePush,
    };
  });

  report.push(info);
  for (const p of info.problems || []) issues.push(`[station ${idx}] ${p}`);
  await page.screenshot({ path: `scripts/home-audit-${idx}.png`, fullPage: false });
}

fs.writeFileSync("scripts/home-audit-report.json", JSON.stringify(report, null, 2));
console.log("ISSUES:", issues.length ? issues.join("\n") : "none");
console.log("\nSummary per station:");
for (const r of report) {
  console.log(`#${r.idx} ${r.className} side=${r.morphSide} offX=${r.morphOffX?.toFixed?.(2)} problems=${(r.problems || []).length}`);
  for (const p of r.problems || []) console.log("  -", p);
}

await browser.close();
if (issues.length) process.exitCode = 1;
