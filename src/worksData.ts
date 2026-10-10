export type GalleryProject = {
  title: string;
  category: string;
  description: string;
  creativeLead: string;
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
    category: "UI Marketplace",
    description:
      "بازار کامپوننت و قالب UI با پیش‌نمایش زنده، سورس آماده و دانلود آنی — کتابخانه حرفه‌ای برای ساخت محصول سریع‌تر.",
    creativeLead: "Founder / Full-stack",
    visualArtist: "NestJS · Prisma · MySQL",
    image: "/works/easycodepie.png",
    href: "https://easycodepie.ir",
  },
  {
    title: "سول — Sol",
    category: "SaaS / رستوران",
    description:
      "نرم‌افزار جامع مدیریت رستوران و اتوماسیون تغذیه؛ فروش، انبار، حسابداری، منوی دیجیتال و مدیریت چندشعبه در یک پلتفرم تحت وب.",
    creativeLead: "Full-stack Product",
    visualArtist: "WordPress · Next.js · TypeScript",
    image: "/works/sol-ir.png",
    href: "https://sol.ir",
  },
  {
    title: "صبا برودت پارس",
    category: "صنعتی / شرکتی",
    description:
      "سایت شرکتی طراحی و ساخت سردخانه‌های آمونیاکی و تجهیزات برودتی؛ کاتالوگ محصول، پروژه‌های EPC، بلاگ تخصصی و درخواست مشاوره.",
    creativeLead: "Corporate Web",
    visualArtist: "Next.js · Node.js · Prisma · MySQL",
    image: "/works/saba-broodat.png",
    href: "https://sababroodat.com",
  },
  {
    title: "Portfolio Template",
    category: "Template",
    description:
      "Awwwards-style portfolio template — motion heroes, WebGL effects, live previews, and copy-ready UI patterns.",
    creativeLead: "Creative Engineer",
    visualArtist: "React · GSAP · Three",
    image: "/works/component-portfolio.png",
    href: "https://mahdi-fallah.vercel.app",
  },
  {
    title: "Story Mode Portfolio",
    category: "Creative / Animation",
    description:
      "پورتفوی استوری‌مود با انیمیشن پیشرفته و تایپوگرافی فارسی؛ تمرکز روی تجربه اسکرول، طراحی خلاقانه و روایت بصری.",
    creativeLead: "Motion Design",
    visualArtist: "Next.js · GSAP",
    image: "/works/story-portfolio.png",
    href: "https://my-webiste-two.vercel.app",
  },
  {
    title: "Portfolio Template 02",
    category: "Template",
    description:
      "Clean personal portfolio template with bilingual layout, skills section, and project storytelling.",
    creativeLead: "Frontend Lead",
    visualArtist: "Next.js · Tailwind",
    image: "/works/mfk-portfolio.png",
    href: "https://example-portfolio-mfk.vercel.app",
  },
  {
    title: "Portfolio Template 03",
    category: "Template",
    description:
      "Dark creative portfolio template — digital canvas branding, social presence, and CTA-driven hero.",
    creativeLead: "UI Designer",
    visualArtist: "Next.js · CSS",
    image: "/works/highnd-canvas.png",
    href: "https://portfolio-mahdi-fallah.vercel.app",
  },
  {
    title: "Nike Store Concept",
    category: "Creative / E-commerce",
    description:
      "Electric Nike storefront concept with bold product heroes, gradient cards, and high-energy commerce UI.",
    creativeLead: "UI Experiment",
    visualArtist: "React · Tailwind",
    image: "/works/nike-store.png",
    href: "https://nike-store-ount.vercel.app",
  },
  {
    title: "ShipCheck",
    category: "DevTools",
    description:
      "Premortem scans for repositories — security, reliability, and ship-readiness findings before you merge to production.",
    creativeLead: "Product Engineer",
    visualArtist: "NestJS · Prisma · Supabase",
    image: "/works/shipcheck.png",
    href: "https://shipcheck-web-phi.vercel.app",
  },
  {
    title: "Helix Web",
    category: "Agency",
    description:
      "سایت آژانس طراحی و توسعه وب با انیمیشن، چندزبانه، پرتفوی خدمات و فرم مشاوره برای پروژه‌های سفارشی.",
    creativeLead: "Frontend Lead",
    visualArtist: "Next.js · GSAP",
    image: "/works/helix-web.png",
    href: "https://helix-web-ultimate.vercel.app",
  },
  {
    title: "Promptify",
    category: "AI Tools",
    description:
      "Production-grade prompt templates for Cursor Agent — depth tiers, stack context, and copy-ready engineering briefs.",
    creativeLead: "Solo Product",
    visualArtist: "Next.js · Motion",
    image: "/works/promptify.png",
    href: "https://prompt-generator-nu-hazel.vercel.app",
  },
  {
    title: "SWOO Tech Mart",
    category: "E-commerce",
    description:
      "فروشگاه آنلاین الکترونیک با تجربه RTL فارسی؛ دسته‌بندی، پیشنهاد ویژه، سبد خرید و رابط کاربری فروشگاهی کامل.",
    creativeLead: "E-commerce UI",
    visualArtist: "Next.js · Tailwind",
    image: "/works/digital-market.png",
    href: "https://digital-market-fl.vercel.app",
  },
];

export type WorkPlace = {
  id: string;
  company: string;
  role: string;
  period: string;
  location: string;
  mode: "onsite" | "remote" | "hybrid";
  summary: string;
  highlight: string;
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
    role: "مؤسس و مهندس فول‌استک",
    period: "۱۴۰۲ — اکنون",
    location: "ایران",
    mode: "remote",
    summary:
      "راه‌اندازی و رهبری بازار کامپوننت و قالب UI؛ معماری NestJS، داده با Prisma/MySQL، پیش‌نمایش زنده و مسیر محصول از ایده تا انتشار.",
    highlight: "ساخت محصول از صفر و مالکیت کامل چرخه توسعه",
    stack: ["NestJS", "Prisma", "MySQL", "Next.js"],
    image: "/works/easycodepie.png",
    href: "https://easycodepie.ir",
    current: true,
  },
  {
    id: "sol",
    company: "Sol",
    role: "توسعه‌دهنده ارشد فول‌استک",
    period: "۱۴۰۱ — ۱۴۰۳",
    location: "ایران · حضوری",
    mode: "onsite",
    summary:
      "توسعه ارشد پلتفرم SaaS مدیریت رستوران و اتوماسیون تغذیه؛ فروش، انبار، منوی دیجیتال و چندشعبه — همکاری حضوری در تیم محصول.",
    highlight: "نقش Senior در محصول عملیاتی با کاربران واقعی",
    stack: ["WordPress", "Next.js", "TypeScript"],
    image: "/works/sol-ir.png",
    href: "https://sol.ir",
  },
  {
    id: "saba",
    company: "صبا برودت پارس",
    role: "توسعه‌دهنده فول‌استک",
    period: "۱۴۰۱ — ۱۴۰۲",
    location: "ایران",
    mode: "hybrid",
    summary:
      "پیاده‌سازی سایت شرکتی صنعتی؛ کاتالوگ محصول، پروژه‌های EPC، بلاگ تخصصی و مسیر درخواست مشاوره با تمرکز روی SEO و عملکرد.",
    highlight: "وب صنعتی مقیاس‌پذیر با مسیر تبدیل مشاوره",
    stack: ["Next.js", "Node.js", "Prisma", "MySQL"],
    image: "/works/saba-broodat.png",
    href: "https://sababroodat.com",
  },
  {
    id: "osloweb",
    company: "OsloWeb",
    role: "توسعه‌دهنده جونیور فول‌استک",
    period: "۱۴۰۰ — ۱۴۰۱",
    location: "نروژ · OsloWeb",
    mode: "remote",
    summary:
      "همکاری فول‌استک با تیم نروژی؛ توسعه فرانت و بک، کیفیت کد، و تحویل ویژگی‌ها در استانداردهای محصول اروپایی.",
    highlight: "تجربه بین‌المللی و کار تیمی فرامرزی",
    stack: ["React", "Node.js", "TypeScript"],
    image: "/exp-osloweb.jpg",
  },
  {
    id: "taftaco",
    company: "Taftaco",
    role: "کارآموز فرانت‌اند",
    period: "۱۳۹۸ — ۱۳۹۹",
    location: "ایران · حضوری",
    mode: "onsite",
    summary:
      "شروع مسیر حرفه‌ای به‌عنوان Intern Frontend؛ یادگیری عمیق رابط کاربری، کامپوننت‌ها و استانداردهای پیاده‌سازی در محیط واقعی.",
    highlight: "پایه‌گذاری مهارت‌های UI و فرهنگ مهندسی",
    stack: ["HTML", "CSS", "JavaScript", "React"],
    image: "/exp-taftaco.jpg",
  },
];

export type NavLink = { label: string; href: string };

/** Single source for site navigation (Persian labels). */
export const SITE_NAV: NavLink[] = [
  { label: "نمونه‌کارها", href: "/works" },
  { label: "سوابق", href: "/experience" },
  { label: "تخصص", href: "/#expertise" },
  { label: "تماس", href: "/contact" },
];

/** @deprecated use SITE_NAV */
export const KEXSIO_NAV = SITE_NAV;
