/**
 * Post-build: emit route HTML shells with correct meta/canonical/JSON-LD
 * so crawlers and social scrapers get per-URL static SEO without a full SSR stack.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dist = join(root, "dist");
const DEFAULT_SITE = "https://mahdifallahkordi.ir";
const siteUrl = (process.env.VITE_SITE_URL || DEFAULT_SITE).replace(/\/$/, "");

const routes = [
  {
    path: "/",
    file: "index.html",
    title: "مهدی فلاح — مهندس فول‌استک و WebGL",
    description:
      "نمونه‌کار مهدی فلاح — توسعه‌دهنده فول‌استک با ۶ سال تجربه، دانشجوی دکتری مهندسی کامپیوتر. React، Node، طراحی سیستم و رابط‌های غوطه‌ور Three.js.",
    ogType: "profile",
  },
  {
    path: "/works",
    file: "works/index.html",
    title: "نمونه‌کارها — مهدی فلاح",
    description:
      "پروژه‌های محصولی مهدی فلاح: EasyCodePie، Sol، صبا برودت پارس و قالب‌های خلاقانه با Next.js، NestJS و WebGL.",
    ogType: "website",
  },
  {
    path: "/experience",
    file: "experience/index.html",
    title: "سوابق کاری — مهدی فلاح",
    description:
      "سوابق مهدی فلاح: مؤسس EasyCodePie، Senior در Sol (حضوری)، OsloWeb نروژ، Taftaco و صبا برودت پارس.",
    ogType: "website",
  },
  {
    path: "/contact",
    file: "contact/index.html",
    title: "تماس با مهدی فلاح — همکاری فول‌استک",
    description:
      "برای همکاری جدی از ایده تا محصول با مهدی فلاح تماس بگیرید. ایمیل highnd32@gmail.com · تلفن 0992 402 1299 · گیت‌هاب highnd.",
    ogType: "website",
  },
];

function abs(path) {
  return path === "/" ? `${siteUrl}/` : `${siteUrl}${path}`;
}

function patchHtml(html, route) {
  const url = abs(route.path);
  const ogImage = `${siteUrl}/og-cover.jpg`;

  let out = html;
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${route.title}</title>`);
  out = out.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
    `<meta name="description" content="${route.description}" />`,
  );
  out = out.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:title" content="${route.title}" />`,
  );
  out = out.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:description" content="${route.description}" />`,
  );
  out = out.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:url" content="${url}" />`,
  );
  out = out.replace(
    /<meta\s+property="og:type"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:type" content="${route.ogType}" />`,
  );
  out = out.replace(
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:image" content="${ogImage}" />`,
  );
  out = out.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/,
    `<meta name="twitter:title" content="${route.title}" />`,
  );
  out = out.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/,
    `<meta name="twitter:description" content="${route.description}" />`,
  );
  out = out.replace(
    /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/>/,
    `<meta name="twitter:image" content="${ogImage}" />`,
  );
  out = out.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/,
    `<link rel="canonical" href="${url}" />`,
  );
  out = out.replace(/data-seo-path="[^"]*"/, `data-seo-path="${route.path}"`);
  return out;
}

const source = join(dist, "index.html");
if (!existsSync(source)) {
  console.error("[seo-prerender] dist/index.html missing — run vite build first");
  process.exit(1);
}

const baseHtml = readFileSync(source, "utf8");

for (const route of routes) {
  const html = patchHtml(baseHtml, route);
  const outPath = join(dist, route.file);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html, "utf8");
  console.log(`[seo-prerender] wrote ${route.file}`);
}

for (const name of ["robots.txt", "sitemap.xml", "llms.txt"]) {
  const p = join(dist, name);
  if (!existsSync(p)) continue;
  let text = readFileSync(p, "utf8");
  text = text.replaceAll("https://mahdifallahkordi.ir", siteUrl);
  text = text.replaceAll("https://mahdi-fallah.vercel.app", siteUrl);
  writeFileSync(p, text, "utf8");
}

console.log(`[seo-prerender] done — site ${siteUrl}`);
