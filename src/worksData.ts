import type { LText } from "./i18n/localize";

export type GalleryProject = {
  title: string;
  category: LText;
  description: LText;
  creativeLead: LText;
  visualArtist: string;
  image: string;
  href?: string;
};

export const KEXSIO_ACCENT = "#21f1a8";
export const KEXSIO_BG = "#171717";
export const KEXSIO_TEAL = "#004741";

export const DEFAULT_PROJECTS: GalleryProject[] = [
  {
    title: "EasyCodePie",
    category: { fa: "بازار UI", en: "UI Marketplace" },
    description: {
      fa: "بازار کامپوننت و قالب UI با پیش‌نمایش زنده، سورس آماده و دانلود آنی — کتابخانه حرفه‌ای برای ساخت محصول سریع‌تر.",
      en: "UI component and template marketplace with live previews, ready source, and instant downloads — a professional library to ship faster.",
    },
    creativeLead: { fa: "مؤسس / فول‌استک", en: "Founder / Full-stack" },
    visualArtist: "NestJS · Prisma · MySQL",
    image: "/works/easycodepie.png",
    href: "https://easycodepie.ir",
  },
  {
    title: "سول — Sol",
    category: { fa: "SaaS / رستوران", en: "SaaS / Restaurant" },
    description: {
      fa: "نرم‌افزار جامع مدیریت رستوران و اتوماسیون تغذیه؛ فروش، انبار، حسابداری، منوی دیجیتال و مدیریت چندشعبه در یک پلتفرم تحت وب.",
      en: "Full restaurant management and food automation SaaS — sales, inventory, accounting, digital menu, and multi-branch ops on one web platform.",
    },
    creativeLead: { fa: "محصول فول‌استک", en: "Full-stack Product" },
    visualArtist: "WordPress · Next.js · TypeScript",
    image: "/works/sol-ir.png",
    href: "https://sol.ir",
  },
  {
    title: "صبا برودت پارس",
    category: { fa: "صنعتی / شرکتی", en: "Industrial / Corporate" },
    description: {
      fa: "سایت شرکتی طراحی و ساخت سردخانه‌های آمونیاکی و تجهیزات برودتی؛ کاتالوگ محصول، پروژه‌های EPC، بلاگ تخصصی و درخواست مشاوره.",
      en: "Corporate site for ammonia cold-storage design and build — product catalog, EPC projects, specialist blog, and consultation requests.",
    },
    creativeLead: { fa: "وب شرکتی", en: "Corporate Web" },
    visualArtist: "Next.js · Node.js · Prisma · MySQL",
    image: "/works/saba-broodat.png",
    href: "https://sababroodat.com",
  },
  {
    title: "Portfolio Template",
    category: { fa: "قالب", en: "Template" },
    description: {
      fa: "قالب پورتفوی سبک Awwwards — هیرو موشن، افکت WebGL، پیش‌نمایش زنده و الگوهای UI آماده کپی.",
      en: "Awwwards-style portfolio template — motion heroes, WebGL effects, live previews, and copy-ready UI patterns.",
    },
    creativeLead: { fa: "مهندس خلاق", en: "Creative Engineer" },
    visualArtist: "React · GSAP · Three",
    image: "/works/component-portfolio.png",
    href: "https://mahdi-fallah.vercel.app",
  },
  {
    title: "Story Mode Portfolio",
    category: { fa: "خلاق / انیمیشن", en: "Creative / Animation" },
    description: {
      fa: "پورتفوی استوری‌مود با انیمیشن پیشرفته و تایپوگرافی فارسی؛ تمرکز روی تجربه اسکرول، طراحی خلاقانه و روایت بصری.",
      en: "Story-mode portfolio with advanced animation and Persian typography — scroll experience, creative design, and visual narrative.",
    },
    creativeLead: { fa: "طراحی موشن", en: "Motion Design" },
    visualArtist: "Next.js · GSAP",
    image: "/works/story-portfolio.png",
    href: "https://my-webiste-two.vercel.app",
  },
  {
    title: "Portfolio Template 02",
    category: { fa: "قالب", en: "Template" },
    description: {
      fa: "قالب پورتفوی شخصی تمیز با چیدمان دو زبانه، بخش مهارت‌ها و روایت پروژه.",
      en: "Clean personal portfolio template with bilingual layout, skills section, and project storytelling.",
    },
    creativeLead: { fa: "لید فرانت‌اند", en: "Frontend Lead" },
    visualArtist: "Next.js · Tailwind",
    image: "/works/mfk-portfolio.png",
    href: "https://example-portfolio-mfk.vercel.app",
  },
  {
    title: "Portfolio Template 03",
    category: { fa: "قالب", en: "Template" },
    description: {
      fa: "قالب پورتفوی خلاق تاریک — برندینگ بوم دیجیتال، حضور اجتماعی و هیرو با CTA.",
      en: "Dark creative portfolio template — digital canvas branding, social presence, and CTA-driven hero.",
    },
    creativeLead: { fa: "طراح UI", en: "UI Designer" },
    visualArtist: "Next.js · CSS",
    image: "/works/highnd-canvas.png",
    href: "https://portfolio-mahdi-fallah.vercel.app",
  },
  {
    title: "Nike Store Concept",
    category: { fa: "خلاق / فروشگاه", en: "Creative / E-commerce" },
    description: {
      fa: "کانسپت فروشگاه Nike با هیروهای پرانرژی، کارت‌های گرادیان و UI تجارت پرتحرک.",
      en: "Electric Nike storefront concept with bold product heroes, gradient cards, and high-energy commerce UI.",
    },
    creativeLead: { fa: "آزمایش UI", en: "UI Experiment" },
    visualArtist: "React · Tailwind",
    image: "/works/nike-store.png",
    href: "https://nike-store-ount.vercel.app",
  },
  {
    title: "ShipCheck",
    category: { fa: "ابزار توسعه", en: "DevTools" },
    description: {
      fa: "اسکن پیش‌از‌ادغام برای مخازن — یافته‌های امنیت، پایداری و آمادگی انتشار قبل از تولید.",
      en: "Premortem scans for repositories — security, reliability, and ship-readiness findings before you merge to production.",
    },
    creativeLead: { fa: "مهندس محصول", en: "Product Engineer" },
    visualArtist: "NestJS · Prisma · Supabase",
    image: "/works/shipcheck.png",
    href: "https://shipcheck-web-phi.vercel.app",
  },
  {
    title: "Helix Web",
    category: { fa: "آژانس", en: "Agency" },
    description: {
      fa: "سایت آژانس طراحی و توسعه وب با انیمیشن، چندزبانه، پرتفوی خدمات و فرم مشاوره برای پروژه‌های سفارشی.",
      en: "Design & web agency site with animation, multilingual UI, service portfolio, and consultation flow for custom projects.",
    },
    creativeLead: { fa: "لید فرانت‌اند", en: "Frontend Lead" },
    visualArtist: "Next.js · GSAP",
    image: "/works/helix-web.png",
    href: "https://helix-web-ultimate.vercel.app",
  },
  {
    title: "Promptify",
    category: { fa: "ابزار AI", en: "AI Tools" },
    description: {
      fa: "قالب‌های پرامپت سطح تولید برای Cursor Agent — عمق، زمینه استک و بریف‌های مهندسی آماده کپی.",
      en: "Production-grade prompt templates for Cursor Agent — depth tiers, stack context, and copy-ready engineering briefs.",
    },
    creativeLead: { fa: "محصول انفرادی", en: "Solo Product" },
    visualArtist: "Next.js · Motion",
    image: "/works/promptify.png",
    href: "https://prompt-generator-nu-hazel.vercel.app",
  },
  {
    title: "SWOO Tech Mart",
    category: { fa: "فروشگاه آنلاین", en: "E-commerce" },
    description: {
      fa: "فروشگاه آنلاین الکترونیک با تجربه RTL فارسی؛ دسته‌بندی، پیشنهاد ویژه، سبد خرید و رابط کاربری فروشگاهی کامل.",
      en: "Electronics e-commerce with Persian RTL experience — categories, featured deals, cart, and a full storefront UI.",
    },
    creativeLead: { fa: "UI فروشگاه", en: "E-commerce UI" },
    visualArtist: "Next.js · Tailwind",
    image: "/works/digital-market.png",
    href: "https://digital-market-fl.vercel.app",
  },
];

export type WorkPlace = {
  id: string;
  company: string;
  role: LText;
  period: LText;
  location: LText;
  mode: "onsite" | "remote" | "hybrid";
  summary: LText;
  highlight: LText;
  stack: string[];
  image: string;
  href?: string;
  current?: boolean;
};

/** Places / roles — edit freely as your CV evolves. */
export const WORK_PLACES: WorkPlace[] = [
  {
    id: "easycodepie",
    company: "EasyCodePie",
    role: {
      fa: "مؤسس و مهندس فول‌استک",
      en: "Founder & Full-stack Engineer",
    },
    period: { fa: "۱۴۰۲ — اکنون", en: "2023 — Present" },
    location: { fa: "ایران", en: "Iran" },
    mode: "remote",
    summary: {
      fa: "راه‌اندازی و رهبری بازار کامپوننت و قالب UI؛ معماری NestJS، داده با Prisma/MySQL، پیش‌نمایش زنده و مسیر محصول از ایده تا انتشار.",
      en: "Founded and led a UI component/template marketplace — NestJS architecture, Prisma/MySQL data, live previews, and product path from idea to launch.",
    },
    highlight: {
      fa: "ساخت محصول از صفر و مالکیت کامل چرخه توسعه",
      en: "Built from zero with full ownership of the development cycle",
    },
    stack: ["NestJS", "Prisma", "MySQL", "Next.js"],
    image: "/works/easycodepie.png",
    href: "https://easycodepie.ir",
    current: true,
  },
  {
    id: "sol",
    company: "Sol",
    role: {
      fa: "توسعه‌دهنده ارشد فول‌استک",
      en: "Senior Full-stack Developer",
    },
    period: { fa: "۱۴۰۱ — ۱۴۰۳", en: "2022 — 2024" },
    location: { fa: "ایران · حضوری", en: "Iran · Onsite" },
    mode: "onsite",
    summary: {
      fa: "توسعه ارشد پلتفرم SaaS مدیریت رستوران و اتوماسیون تغذیه؛ فروش، انبار، منوی دیجیتال و چندشعبه — همکاری حضوری در تیم محصول.",
      en: "Senior development on restaurant SaaS and food automation — sales, inventory, digital menu, multi-branch — onsite with the product team.",
    },
    highlight: {
      fa: "نقش Senior در محصول عملیاتی با کاربران واقعی",
      en: "Senior role on an operational product with real users",
    },
    stack: ["WordPress", "Next.js", "TypeScript"],
    image: "/works/sol-ir.png",
    href: "https://sol.ir",
  },
  {
    id: "saba",
    company: "صبا برودت پارس",
    role: { fa: "توسعه‌دهنده فول‌استک", en: "Full-stack Developer" },
    period: { fa: "۱۴۰۱ — ۱۴۰۲", en: "2022 — 2023" },
    location: { fa: "ایران", en: "Iran" },
    mode: "hybrid",
    summary: {
      fa: "پیاده‌سازی سایت شرکتی صنعتی؛ کاتالوگ محصول، پروژه‌های EPC، بلاگ تخصصی و مسیر درخواست مشاوره با تمرکز روی SEO و عملکرد.",
      en: "Built an industrial corporate site — product catalog, EPC projects, specialist blog, and consultation funnel with SEO and performance focus.",
    },
    highlight: {
      fa: "وب صنعتی مقیاس‌پذیر با مسیر تبدیل مشاوره",
      en: "Scalable industrial web with consultation conversion path",
    },
    stack: ["Next.js", "Node.js", "Prisma", "MySQL"],
    image: "/works/saba-broodat.png",
    href: "https://sababroodat.com",
  },
  {
    id: "osloweb",
    company: "OsloWeb",
    role: {
      fa: "توسعه‌دهنده جونیور فول‌استک",
      en: "Junior Full-stack Developer",
    },
    period: { fa: "۱۴۰۰ — ۱۴۰۱", en: "2021 — 2022" },
    location: { fa: "نروژ · OsloWeb", en: "Norway · OsloWeb" },
    mode: "remote",
    summary: {
      fa: "همکاری فول‌استک با تیم نروژی؛ توسعه فرانت و بک، کیفیت کد، و تحویل ویژگی‌ها در استانداردهای محصول اروپایی.",
      en: "Full-stack collaboration with a Norwegian team — frontend and backend, code quality, and features delivered to European product standards.",
    },
    highlight: {
      fa: "تجربه بین‌المللی و کار تیمی فرامرزی",
      en: "International experience and cross-border teamwork",
    },
    stack: ["React", "Node.js", "TypeScript"],
    image: "/exp-osloweb.jpg",
  },
  {
    id: "taftaco",
    company: "Taftaco",
    role: { fa: "کارآموز فرانت‌اند", en: "Frontend Intern" },
    period: { fa: "۱۳۹۸ — ۱۳۹۹", en: "2019 — 2020" },
    location: { fa: "ایران · حضوری", en: "Iran · Onsite" },
    mode: "onsite",
    summary: {
      fa: "شروع مسیر حرفه‌ای به‌عنوان Intern Frontend؛ یادگیری عمیق رابط کاربری، کامپوننت‌ها و استانداردهای پیاده‌سازی در محیط واقعی.",
      en: "Started as a frontend intern — deep learning of UI, components, and implementation standards in a real product environment.",
    },
    highlight: {
      fa: "پایه‌گذاری مهارت‌های UI و فرهنگ مهندسی",
      en: "Foundation in UI skills and engineering culture",
    },
    stack: ["HTML", "CSS", "JavaScript", "React"],
    image: "/exp-taftaco.jpg",
  },
];

export type NavLink = { href: string; key: keyof import("./i18n/messages").Messages["nav"] };

/** Single source for site navigation hrefs (labels come from i18n). */
export const SITE_NAV: NavLink[] = [
  { key: "works", href: "/works" },
  { key: "experience", href: "/experience" },
  { key: "expertise", href: "/#expertise" },
  { key: "contact", href: "/contact" },
];

/** @deprecated use SITE_NAV */
export const KEXSIO_NAV = SITE_NAV;
