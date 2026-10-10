/** Canonical site URL — override with VITE_SITE_URL at build time. */
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || "https://mahdifallahkordi.ir"
).replace(/\/$/, "");

export const SITE_NAME = "مهدی فلاح";
export const SITE_NAME_EN = "Mahdi Fallah";
export const SITE_LOCALE = "fa_IR";
export const SITE_LOCALE_ALT = "en_US";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-cover.jpg`;
export const THEME_COLOR = "#171717";

export const PERSON = {
  nameFa: "مهدی فلاح",
  nameEn: "Mahdi Fallah",
  jobTitle: "مهندس نرم‌افزار فول‌استک",
  jobTitleEn: "Full-stack Software Engineer",
  description:
    "مهندس نرم‌افزار فول‌استک با ۶ سال تجربه در طراحی محصول، معماری بک‌اند، React/TypeScript، Node و رابط‌های غوطه‌ور WebGL/Three.js. دانشجوی دکتری مهندسی کامپیوتر.",
  descriptionEn:
    "Full-stack software engineer with 6 years of experience in product design, backend architecture, React/TypeScript, Node, and immersive WebGL/Three.js interfaces. PhD candidate in Computer Engineering.",
  email: "highnd32@gmail.com",
  telephone: "+989924021299",
  telephoneDisplay: "0992 402 1299",
  github: "https://github.com/highnd",
  githubHandle: "highnd",
  knowsAbout: [
    "React",
    "TypeScript",
    "Node.js",
    "Next.js",
    "NestJS",
    "System Design",
    "WebGL",
    "Three.js",
    "Full-stack Development",
    "Product Engineering",
  ],
} as const;

export type RouteSeo = {
  path: string;
  title: string;
  description: string;
  ogType?: "website" | "profile";
};

export const ROUTE_SEO: Record<string, RouteSeo> = {
  "/": {
    path: "/",
    title: "مهدی فلاح — مهندس فول‌استک و WebGL",
    description:
      "نمونه‌کار مهدی فلاح — توسعه‌دهنده فول‌استک با ۶ سال تجربه، دانشجوی دکتری مهندسی کامپیوتر. React، Node، طراحی سیستم و رابط‌های غوطه‌ور Three.js.",
    ogType: "profile",
  },
  "/works": {
    path: "/works",
    title: "نمونه‌کارها — مهدی فلاح",
    description:
      "پروژه‌های محصولی مهدی فلاح: EasyCodePie، Sol، صبا برودت پارس و قالب‌های خلاقانه با Next.js، NestJS و WebGL.",
    ogType: "website",
  },
  "/experience": {
    path: "/experience",
    title: "سوابق کاری — مهدی فلاح",
    description:
      "سوابق مهدی فلاح: مؤسس EasyCodePie، Senior در Sol (حضوری)، OsloWeb نروژ، Taftaco و صبا برودت پارس.",
    ogType: "website",
  },
  "/contact": {
    path: "/contact",
    title: "تماس با مهدی فلاح — همکاری فول‌استک",
    description:
      "برای همکاری جدی از ایده تا محصول با مهدی فلاح تماس بگیرید. ایمیل highnd32@gmail.com · تلفن 0992 402 1299 · گیت‌هاب highnd.",
    ogType: "website",
  },
};

export const FAQ_ITEMS = [
  {
    q: "مهدی فلاح چه تخصصی دارد؟",
    a: "فول‌استک‌دولوپمنت با تمرکز روی React و TypeScript در فرانت‌اند، Node و معماری سرویس در بک‌اند، طراحی سیستم مقیاس‌پذیر، و تجربه‌های تعاملی WebGL/Three.js.",
  },
  {
    q: "چطور می‌توان برای پروژه همکاری کرد؟",
    a: "از صفحه تماس درخواست پروژه بفرستید یا مستقیم به highnd32@gmail.com ایمیل بزنید / با 0992 402 1299 تماس بگیرید.",
  },
  {
    q: "چه نوع پروژه‌هایی در نمونه‌کارها دیده می‌شود؟",
    a: "بازار UI، SaaS رستوران، سایت‌های شرکتی صنعتی، فروشگاه آنلاین، و پورتفوی‌های خلاقانه با موشن و WebGL — از ایده تا انتشار.",
  },
  {
    q: "آیا امکان همکاری ریموت وجود دارد؟",
    a: "بله؛ همکاری فول‌استک و معماری محصول به‌صورت ریموت و پروژه‌محور انجام می‌شود.",
  },
] as const;

export function absoluteUrl(path: string): string {
  if (!path || path === "/") return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getRouteSeo(pathname: string): RouteSeo {
  return ROUTE_SEO[pathname] ?? ROUTE_SEO["/"];
}

export function buildPersonJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: PERSON.nameFa,
    alternateName: [PERSON.nameEn, PERSON.githubHandle],
    jobTitle: PERSON.jobTitle,
    description: PERSON.description,
    url: SITE_URL,
    email: PERSON.email,
    telephone: PERSON.telephone,
    image: DEFAULT_OG_IMAGE,
    sameAs: [PERSON.github],
    knowsAbout: [...PERSON.knowsAbout],
    nationality: "IR",
    knowsLanguage: ["fa", "en"],
  };
}

export function buildWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: `${PERSON.nameFa} — Portfolio`,
    alternateName: `${PERSON.nameEn} Portfolio`,
    url: SITE_URL,
    inLanguage: ["fa", "en"],
    description: PERSON.description,
    publisher: { "@id": `${SITE_URL}/#person` },
  };
}

export function buildProfessionalServiceJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${SITE_URL}/#service`,
    name: `${PERSON.nameFa} — مهندسی فول‌استک`,
    description: PERSON.description,
    url: SITE_URL,
    image: DEFAULT_OG_IMAGE,
    email: PERSON.email,
    telephone: PERSON.telephone,
    areaServed: { "@type": "Country", name: "Iran" },
    availableLanguage: ["Persian", "English"],
    provider: { "@id": `${SITE_URL}/#person` },
    sameAs: [PERSON.github],
  };
}

export function buildFaqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE_URL}/#faq`,
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

export function buildBreadcrumbJsonLd(pathname: string) {
  const crumbs = [{ name: "خانه", path: "/" }];
  if (pathname === "/works") crumbs.push({ name: "نمونه‌کارها", path: "/works" });
  if (pathname === "/experience") crumbs.push({ name: "سوابق", path: "/experience" });
  if (pathname === "/contact") crumbs.push({ name: "تماس", path: "/contact" });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

export function buildGraphJsonLd(pathname: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildPersonJsonLd(),
      buildWebsiteJsonLd(),
      buildProfessionalServiceJsonLd(),
      buildFaqJsonLd(),
      buildBreadcrumbJsonLd(pathname),
    ],
  };
}
