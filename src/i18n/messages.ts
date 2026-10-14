export type Locale = "fa" | "en";

export const LOCALE_STORAGE_KEY = "portfolio-locale";

export type Messages = {
  nav: {
    works: string;
    experience: string;
    expertise: string;
    contact: string;
  };
  langToggle: { fa: string; en: string; aria: string };
  home: {
    name: string;
    role: string;
    lead: string;
    phdTitle: string;
    phdBody: string;
    manifestoLine1: string;
    manifestoBeforeOutline: string;
    manifestoOutline: string;
    manifestoAfterOutline: string;
    fullstackTitle: string;
    fullstackBody: string;
    systemTitle: string;
    systemBody: string;
    systemLi1: string;
    systemLi2: string;
    processTitle: string;
    processBody: string;
    expertiseTitle: string;
    colFrontend: string;
    colBackend: string;
    colInteractive: string;
    colProduct: string;
    fe1: string;
    fe2: string;
    fe3: string;
    be1: string;
    be2: string;
    be3: string;
    ix1: string;
    ix2: string;
    ix3: string;
    pr1: string;
    pr2: string;
    pr3: string;
    principlesTitle: string;
    pQuality: string;
    pPrecision: string;
    pArchitecture: string;
    pMotion: string;
    pClarity: string;
    ctaEmail: string;
    ctaContact: string;
    ctaWorks: string;
    ctaGithub: string;
    scrollHint: string;
  };
  works: {
    brandLabel: string;
    brandIntro: string;
    role: string;
    stack: string;
    liveProject: string;
    visitSite: string;
    galleryAria: string;
    prev: string;
    next: string;
    thumbsAria: string;
  };
  experience: {
    kicker: string;
    titleBefore: string;
    titleEm: string;
    lede: string;
    stations: string;
    start: string;
    timelineAria: string;
    stationsAria: string;
    current: string;
    stackAria: string;
    prev: string;
    next: string;
    ctaTitle: string;
    ctaBody: string;
    ctaPrimary: string;
    ctaWorks: string;
    modeOnsite: string;
    modeRemote: string;
    modeHybrid: string;
  };
  contact: {
    kicker: string;
    titleLine1: string;
    titleLine2: string;
    titleOutline: string;
    lede: string;
    email: string;
    phone: string;
    github: string;
    panelTitle: string;
    panelSub: string;
  };
};

export const messages: Record<Locale, Messages> = {
  fa: {
    nav: {
      works: "نمونه‌کارها",
      experience: "سوابق",
      expertise: "تخصص",
      contact: "تماس",
    },
    langToggle: {
      fa: "فا",
      en: "EN",
      aria: "تغییر زبان",
    },
    home: {
      name: "مهدی فلاح",
      role: "مهندس نرم‌افزار",
      lead: "شش سال طراحی و توسعه محصول — از تجربه کاربری تا معماری بک‌اند",
      phdTitle: "دکتری\nمهندسی کامپیوتر",
      phdBody: "دکتری مهندسی کامپیوتر — پژوهش، مقاله و نگاه سیستمی به مسئله",
      manifestoLine1: "جایی که خلاقیت محصول",
      manifestoBeforeOutline: "با دقت",
      manifestoOutline: "مهندسی",
      manifestoAfterOutline: "یکی می‌شود",
      fullstackTitle: "فول‌استک",
      fullstackBody: "از رابط کاربری تا سرویس و داده — یک مسیر یکپارچه تا انتشار",
      systemTitle: "طراحی\nسیستم",
      systemBody: "معماری مقیاس‌پذیر با مرزهای مشخص، تصمیم‌های آگاهانه و مسیر رشد",
      systemLi1: "تفکیک دامنه و قرارداد سرویس‌ها",
      systemLi2: "مقیاس‌پذیری، کش و تحمل خطا",
      processTitle: "فرآیند",
      processBody: "از ایده تا انتشار — چرخه کوتاه، معماری پایدار، نگهداری آسان",
      expertiseTitle: "حوزه‌های تخصصی",
      colFrontend: "فرانت‌اند",
      colBackend: "بک‌اند",
      colInteractive: "تجربه تعاملی",
      colProduct: "اجرای محصول",
      fe1: "React و TypeScript",
      fe2: "موشن و تعامل",
      fe3: "سیستم طراحی",
      be1: "Node و API",
      be2: "معماری سرویس",
      be3: "دیتابیس و احراز هویت",
      ix1: "WebGL / Three.js",
      ix2: "وب غوطه‌ور",
      ix3: "روایت بصری",
      pr1: "تفکر محصولی",
      pr2: "بهینه‌سازی عملکرد",
      pr3: "انتشار و تکرار",
      principlesTitle: "اصول کار من",
      pQuality: "کیفیت",
      pPrecision: "دقت",
      pArchitecture: "معماری",
      pMotion: "پویایی",
      pClarity: "وضوح",
      ctaEmail: "برای همکاری در تماس باشید",
      ctaContact: "تماس",
      ctaWorks: "نمونه‌کارها",
      ctaGithub: "گیت‌هاب",
      scrollHint: "اسکرول کنید",
    },
    works: {
      brandLabel: "توسعه‌دهنده فول‌استک",
      brandIntro:
        "مهدی فلاح — شش سال ساخت محصولات فول‌استک خلاق، رابط‌های غوطه‌ور و بک‌اند NestJS پایدار.",
      role: "نقش",
      stack: "استک",
      liveProject: "پروژه زنده",
      visitSite: "مشاهده سایت",
      galleryAria: "گالری پروژه‌ها",
      prev: "پروژه قبلی",
      next: "پروژه بعدی",
      thumbsAria: "تصاویر بندانگشتی پروژه‌ها",
    },
    experience: {
      kicker: "مسیر حرفه‌ای · ۶+ سال",
      titleBefore: "جایی که",
      titleEm: "کار کردم",
      lede: "از کارآموزی در Taftaco تا Senior حضوری در Sol، همکاری با OsloWeb نروژ و بنیان‌گذاری EasyCodePie.",
      stations: "ایستگاه",
      start: "شروع مسیر",
      timelineAria: "خط زمان سوابق کاری",
      stationsAria: "ایستگاه‌های مسیر",
      current: "فعلی",
      stackAria: "فناوری‌ها",
      prev: "قبلی",
      next: "بعدی",
      ctaTitle: "ایستگاه بعدی: همکاری جدی",
      ctaBody:
        "برای محصول فول‌استک، معماری دقیق و اجرای بین‌المللی — از ایده تا انتشار در تماسم.",
      ctaPrimary: "شروع همکاری",
      ctaWorks: "نمونه‌کارها",
      modeOnsite: "حضوری",
      modeRemote: "ریموت",
      modeHybrid: "هیبرید",
    },
    contact: {
      kicker: "آماده همکاری · ۲۰۲۶",
      titleLine1: "شروع",
      titleLine2: "یک همکاری",
      titleOutline: "جدی",
      lede: "از ایده تا محصول — فول‌استک، معماری بک‌اند و رابط‌های غوطه‌ور با اجرای دقیق.",
      email: "ایمیل",
      phone: "تلفن",
      github: "گیت‌هاب",
      panelTitle: "راه‌های تماس",
      panelSub: "برای همکاری جدی مستقیم پیام بدهید یا تماس بگیرید.",
    },
  },
  en: {
    nav: {
      works: "Works",
      experience: "Experience",
      expertise: "Expertise",
      contact: "Contact",
    },
    langToggle: {
      fa: "FA",
      en: "EN",
      aria: "Switch language",
    },
    home: {
      name: "Mahdi Fallah",
      role: "Software Engineer",
      lead: "Six years designing and shipping products — from UX to backend architecture",
      phdTitle: "PhD\nComputer Engineering",
      phdBody: "PhD candidate in Computer Engineering — research, papers, and systems thinking",
      manifestoLine1: "Where product creativity",
      manifestoBeforeOutline: "meets precise",
      manifestoOutline: "engineering",
      manifestoAfterOutline: "",
      fullstackTitle: "Full-stack",
      fullstackBody: "From UI to services and data — one coherent path to launch",
      systemTitle: "System\nDesign",
      systemBody: "Scalable architecture with clear boundaries, deliberate decisions, and room to grow",
      systemLi1: "Domain boundaries and service contracts",
      systemLi2: "Scale, caching, and fault tolerance",
      processTitle: "Process",
      processBody: "From idea to launch — short cycles, durable architecture, easy maintenance",
      expertiseTitle: "Expertise",
      colFrontend: "Frontend",
      colBackend: "Backend",
      colInteractive: "Interactive",
      colProduct: "Product",
      fe1: "React & TypeScript",
      fe2: "Motion & interaction",
      fe3: "Design systems",
      be1: "Node & APIs",
      be2: "Service architecture",
      be3: "Data & auth",
      ix1: "WebGL / Three.js",
      ix2: "Immersive web",
      ix3: "Visual storytelling",
      pr1: "Product thinking",
      pr2: "Performance",
      pr3: "Ship & iterate",
      principlesTitle: "How I work",
      pQuality: "Quality",
      pPrecision: "Precision",
      pArchitecture: "Architecture",
      pMotion: "Motion",
      pClarity: "Clarity",
      ctaEmail: "Get in touch to collaborate",
      ctaContact: "Contact",
      ctaWorks: "Works",
      ctaGithub: "GitHub",
      scrollHint: "Scroll",
    },
    works: {
      brandLabel: "Full-stack Developer",
      brandIntro:
        "Mahdi Fallah — 6 years building creative full-stack products, immersive interfaces, and solid NestJS backends.",
      role: "Role",
      stack: "Stack",
      liveProject: "Live Project",
      visitSite: "Visit Site",
      galleryAria: "Creative project gallery",
      prev: "Previous project",
      next: "Next project",
      thumbsAria: "Project thumbnails",
    },
    experience: {
      kicker: "Career path · 6+ years",
      titleBefore: "Where I’ve",
      titleEm: "worked",
      lede: "From an internship at Taftaco to onsite Senior at Sol, remote work with OsloWeb in Norway, and founding EasyCodePie.",
      stations: "stations",
      start: "Start the path",
      timelineAria: "Work experience timeline",
      stationsAria: "Path stations",
      current: "Current",
      stackAria: "Technologies",
      prev: "Previous",
      next: "Next",
      ctaTitle: "Next stop: serious collaboration",
      ctaBody:
        "For full-stack products, precise architecture, and international delivery — from idea to launch, reach out.",
      ctaPrimary: "Start a project",
      ctaWorks: "Works",
      modeOnsite: "Onsite",
      modeRemote: "Remote",
      modeHybrid: "Hybrid",
    },
    contact: {
      kicker: "Open for work · 2026",
      titleLine1: "Let’s start",
      titleLine2: "a serious",
      titleOutline: "collaboration",
      lede: "From idea to product — full-stack, backend architecture, and immersive interfaces with precise execution.",
      email: "Email",
      phone: "Phone",
      github: "GitHub",
      panelTitle: "Contact details",
      panelSub: "Reach out directly for serious collaboration.",
    },
  },
};
