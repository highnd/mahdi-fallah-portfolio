import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  DEFAULT_PROJECTS,
  type GalleryProject,
  KEXSIO_ACCENT,
  KEXSIO_BG,
} from "./worksData";
import SiteNav from "./SiteNav";
import { useLocale } from "./i18n/LocaleContext";
import { lx } from "./i18n/localize";

export type WorksGalleryProps = {
  projects?: GalleryProject[];
  brandName?: string;
  accentColor?: string;
  className?: string;
};

const CURRENT_YEAR = new Date().getFullYear();
const PRELOAD_COUNT = 3;

function padIndex(i: number): string {
  return String(i + 1).padStart(2, "0");
}

export default function WorksGallery({
  projects = DEFAULT_PROJECTS,
  brandName = "Mahdi",
  accentColor = KEXSIO_ACCENT,
  className = "",
}: WorksGalleryProps) {
  const { locale, t } = useLocale();
  const [activeIndex, setActiveIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [bgFrontIndex, setBgFrontIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitioningRef = useRef(false);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const reducedMotion = useRef(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLParagraphElement>(null);
  const counterRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const creditsRef = useRef<HTMLDivElement>(null);
  const imageWrapRef = useRef<HTMLAnchorElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const bgARef = useRef<HTMLDivElement>(null);
  const bgBRef = useRef<HTMLDivElement>(null);
  const thumbRailRef = useRef<HTMLDivElement>(null);

  const total = projects.length;
  const project = projects[displayIndex];

  const textEls = useCallback(() => {
    const els: (HTMLParagraphElement | HTMLHeadingElement | HTMLDivElement)[] = [];
    if (categoryRef.current) els.push(categoryRef.current);
    if (counterRef.current) els.push(counterRef.current);
    if (titleRef.current) els.push(titleRef.current);
    if (descRef.current) els.push(descRef.current);
    if (dividerRef.current) els.push(dividerRef.current);
    if (creditsRef.current) els.push(creditsRef.current);
    return els;
  }, []);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    projects.slice(0, PRELOAD_COUNT).forEach((p) => {
      const img = new Image();
      img.src = p.image;
    });
  }, [projects]);

  // Lock document scroll so rail/thumb transforms never shove the page sideways.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    window.scrollTo(0, 0);
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, []);

  const scrollThumbIntoView = useCallback((index: number) => {
    const rail = thumbRailRef.current;
    if (!rail) return;
    const thumb = rail.querySelector<HTMLElement>(`[data-thumb-index="${index}"]`);
    if (!thumb) return;

    // Scroll only the rail — never the document (scrollIntoView shifts the whole page).
    const isHorizontal = getComputedStyle(rail).flexDirection === "row";
    if (isHorizontal) {
      const left = thumb.offsetLeft - rail.clientWidth / 2 + thumb.clientWidth / 2;
      rail.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
    } else {
      const top = thumb.offsetTop - rail.clientHeight / 2 + thumb.clientHeight / 2;
      rail.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }
  }, []);

  const goTo = useCallback(
    (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= total || nextIndex === activeIndex) return;
      if (transitioningRef.current) return;

      const instant = reducedMotion.current;

      if (instant) {
        setActiveIndex(nextIndex);
        setDisplayIndex(nextIndex);
        setBgFrontIndex(nextIndex);
        scrollThumbIntoView(nextIndex);
        return;
      }

      transitioningRef.current = true;
      setIsTransitioning(true);
      setActiveIndex(nextIndex);
      timelineRef.current?.kill();

      const nextProject = projects[nextIndex];
      const tl = gsap.timeline({
        onComplete: () => {
          transitioningRef.current = false;
          setIsTransitioning(false);
          setDisplayIndex(nextIndex);
        },
      });
      timelineRef.current = tl;

      const texts = textEls();
      const imgWrap = imageWrapRef.current;
      const img = imageRef.current;

      // Exit text
      tl.to(texts, {
        y: -28,
        opacity: 0,
        duration: 0.45,
        stagger: 0.05,
        ease: "power4.in",
      });

      // Exit image
      if (imgWrap && img) {
        tl.to(
          imgWrap,
          { y: 40, scale: 0.7, opacity: 0, duration: 0.6, ease: "power4.in" },
          0.05,
        );
      }

      // Background cross-fade
      const backLayer = bgBRef.current;
      const frontLayer = bgARef.current;
      if (backLayer && frontLayer) {
        backLayer.style.backgroundImage = `url(${nextProject.image})`;
        gsap.set(backLayer, { opacity: 0 });
        tl.to(backLayer, { opacity: 1, duration: 0.85, ease: "power2.inOut" }, 0.1);
        tl.to(frontLayer, { opacity: 0, duration: 0.85, ease: "power2.inOut" }, 0.1);
        tl.add(() => {
          setBgFrontIndex(nextIndex);
          frontLayer.style.backgroundImage = `url(${nextProject.image})`;
          gsap.set(frontLayer, { opacity: 1 });
          gsap.set(backLayer, { opacity: 0 });
        });
      }

      // Swap content mid-transition
      tl.add(() => {
        setDisplayIndex(nextIndex);
        if (img) {
          img.src = nextProject.image;
          img.alt = `${nextProject.title} — ${lx(locale, nextProject.category)}`;
        }
        gsap.set(texts, { y: 36, opacity: 0 });
        if (imgWrap) gsap.set(imgWrap, { y: 48, scale: 0.7, opacity: 0 });
      });

      // Enter text
      tl.to(texts, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.05,
        ease: "power4.out",
      });

      // Enter image
      if (imgWrap) {
        tl.to(
          imgWrap,
          { y: 0, scale: 1, opacity: 1, duration: 0.95, ease: "power4.out" },
          "-=0.55",
        );
      }

      scrollThumbIntoView(nextIndex);
    },
    [activeIndex, projects, textEls, total, scrollThumbIntoView, locale],
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  useEffect(() => {
    return () => {
      timelineRef.current?.kill();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`wg-root ${className}`}
      dir="ltr"
      style={{ "--wg-accent": accentColor, "--wg-bg": KEXSIO_BG } as React.CSSProperties}
    >
      <style>{`
        .wg-root {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          height: 100svh;
          height: 100dvh;
          min-height: -webkit-fill-available;
          overflow: hidden;
          background: var(--wg-bg);
          color: #e8fff8;
          font-family: "Vazirmatn", "Sora", system-ui, sans-serif;
          direction: ltr;
        }

        .wg-bg {
          position: absolute;
          inset: -4%;
          z-index: 0;
          background-size: cover;
          background-position: center;
          filter: blur(48px) saturate(1.15);
          transform: scale(1.08);
          will-change: opacity;
        }
        .wg-bg-a { z-index: 0; opacity: 1; }
        .wg-bg-b { z-index: 0; opacity: 0; }

        .wg-overlay {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background:
            linear-gradient(180deg, rgba(23,23,23,0.55) 0%, rgba(23,23,23,0.2) 35%, rgba(23,23,23,0.75) 100%),
            linear-gradient(90deg, rgba(23,23,23,0.65) 0%, rgba(0,71,65,0.25) 45%, rgba(23,23,23,0.5) 100%);
        }
        .wg-grain {
          position: absolute;
          inset: 0;
          z-index: 2;
          opacity: 0.04;
          pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        .wg-layout {
          position: relative;
          z-index: 3;
          display: grid;
          grid-template-columns: 22% 1fr 110px;
          grid-template-rows: 1fr;
          height: 100%;
          height: 100svh;
          height: 100dvh;
          min-height: -webkit-fill-available;
          width: 100%;
          max-width: 100%;
          overflow: hidden;
        }

        /* Sidebar */
        .wg-sidebar {
          display: flex;
          flex-direction: column;
          border-right: 1px solid rgba(238,241,255,0.1);
          padding: 88px 28px 28px;
          min-width: 0;
        }
        .wg-brand-block {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          padding-left: 4px;
        }
        .wg-accent-line {
          width: 32px;
          height: 2px;
          background: var(--wg-accent);
          margin-bottom: 20px;
        }
        .wg-brand {
          font-family: "Sora", sans-serif;
          font-weight: 800;
          font-size: clamp(2rem, 4vw, 3.2rem);
          letter-spacing: -0.03em;
          line-height: 1;
          margin: 0;
        }
        .wg-brand-label {
          margin-top: 10px;
          font-size: 10px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #7a968e;
        }
        .wg-intro {
          font-size: 0.82rem;
          line-height: 1.55;
          color: #8faaa3;
          max-width: 22ch;
          margin: 0;
        }

        /* Main */
        .wg-main {
          display: flex;
          flex-direction: column;
          padding: 28px 32px 24px 36px;
          min-width: 0;
          overflow: hidden;
        }
        .wg-info {
          flex-shrink: 0;
          max-width: 52ch;
        }
        .wg-category {
          font-size: 11px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--wg-accent);
          margin: 0 0 10px;
          will-change: transform, opacity;
        }
        .wg-counter {
          font-size: 11px;
          letter-spacing: 0.18em;
          color: #7a968e;
          margin: 0 0 14px;
          will-change: transform, opacity;
        }
        .wg-title {
          font-family: "Sora", sans-serif;
          font-weight: 800;
          font-size: clamp(2.2rem, 5.5vw, 4.5rem);
          letter-spacing: -0.03em;
          line-height: 0.95;
          margin: 0 0 16px;
          will-change: transform, opacity;
        }
        .wg-desc {
          font-size: clamp(0.88rem, 1.1vw, 1rem);
          line-height: 1.55;
          color: #9fbab2;
          margin: 0 0 18px;
          will-change: transform, opacity;
        }
        .wg-divider {
          width: 100%;
          height: 1px;
          background: rgba(238,241,255,0.14);
          margin-bottom: 14px;
          will-change: transform, opacity;
        }
        .wg-credits {
          display: flex;
          gap: 28px;
          flex-wrap: wrap;
          will-change: transform, opacity;
        }
        .wg-credit-label {
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #7a968e;
          margin: 0 0 4px;
        }
        .wg-credit-name {
          font-size: 0.82rem;
          color: #e8fff8;
          margin: 0;
        }

        .wg-preview-zone {
          flex: 1;
          display: flex;
          align-items: stretch;
          gap: 12px;
          min-height: 0;
          padding-top: 8px;
          padding-bottom: 16px;
        }
        .wg-arrow {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          border: 1px solid rgba(238,241,255,0.2);
          background: rgba(23,23,23,0.35);
          backdrop-filter: blur(8px);
          color: #e8fff8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.25s, color 0.25s;
          align-self: center;
        }
        .wg-arrow:hover:not(:disabled) {
          border-color: var(--wg-accent);
          color: var(--wg-accent);
        }
        .wg-arrow:disabled {
          opacity: 0.25;
          cursor: not-allowed;
        }
        .wg-arrow svg { width: 16px; height: 16px; }

        .wg-image-wrap {
          position: relative;
          display: block;
          flex: 1;
          width: auto;
          max-width: 82%;
          height: auto;
          min-height: 220px;
          max-height: none;
          align-self: stretch;
          background: rgba(0, 0, 0, 0.25);
          will-change: transform, opacity;
          overflow: hidden;
          color: inherit;
          text-decoration: none;
          cursor: pointer;
        }
        .wg-image-wrap:hover .wg-explore {
          color: var(--wg-accent);
        }
        .wg-image-wrap:hover .wg-explore-icon {
          border-color: var(--wg-accent);
          color: var(--wg-accent);
        }
        .wg-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          display: block;
          user-select: none;
          -webkit-user-drag: none;
        }
        .wg-image-grad-bottom {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 55%, rgba(23,23,23,0.85) 100%);
          pointer-events: none;
        }
        .wg-image-grad-top {
          position: absolute;
          inset: 0;
          background: linear-gradient(0deg, transparent 70%, rgba(255,255,255,0.06) 100%);
          pointer-events: none;
        }
        .wg-image-meta {
          position: absolute;
          left: 16px;
          right: 16px;
          bottom: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          pointer-events: none;
        }
        .wg-story-label {
          font-size: 9px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--wg-accent);
        }
        .wg-year {
          font-size: 11px;
          letter-spacing: 0.12em;
          color: #b8d4cc;
        }
        .wg-explore {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #e8fff8;
        }
        .wg-explore-icon {
          width: 32px;
          height: 32px;
          border: 1px solid rgba(238,241,255,0.35);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Thumbnail rail */
        .wg-rail {
          border-left: 1px solid rgba(238,241,255,0.1);
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 20px 18px 20px 6px;
          min-width: 0;
        }
        .wg-rail::-webkit-scrollbar { display: none; }

        .wg-thumb {
          position: relative;
          flex-shrink: 0;
          width: 86px;
          height: 64px;
          border: none;
          padding: 0;
          cursor: pointer;
          background: transparent;
          overflow: hidden;
          opacity: 0.38;
          transform: translateX(0);
          transition: opacity 0.35s, transform 0.35s;
          margin-left: auto;
        }
        .wg-thumb:hover {
          opacity: 0.72;
          transform: translateX(-4px);
        }
        .wg-thumb-active {
          opacity: 1 !important;
          transform: translateX(-4px) !important;
        }
        .wg-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          user-select: none;
          -webkit-user-drag: none;
        }
        .wg-thumb-num {
          position: absolute;
          top: 6px;
          left: 6px;
          font-size: 9px;
          letter-spacing: 0.1em;
          color: #fff;
          text-shadow: 0 1px 4px rgba(0,0,0,0.6);
        }
        .wg-thumb-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--wg-accent);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.35s ease;
        }
        .wg-thumb-active .wg-thumb-progress {
          transform: scaleX(1);
        }

        /* Mobile */
        @media (max-width: 820px) {
          .wg-layout {
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr auto;
          }
          .wg-sidebar {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            border-right: none;
            border-bottom: 1px solid rgba(238,241,255,0.1);
            padding: 72px 20px 16px;
            gap: 12px;
          }
          .wg-brand-block {
            flex: 0;
            padding: 0;
          }
          .wg-accent-line, .wg-brand-label, .wg-intro { display: none; }
          .wg-brand { font-size: 1.25rem; }
          .wg-main {
            padding: 16px 20px 12px;
          }
          .wg-desc {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .wg-credit-name { font-size: 0.75rem; }
          .wg-preview-zone {
            align-items: stretch;
            gap: 8px;
          }
          .wg-image-wrap {
            max-width: 90%;
            width: auto;
            height: auto;
            min-height: 0;
          }
          .wg-arrow {
            width: 34px;
            height: 34px;
          }
          .wg-rail {
            flex-direction: row;
            overflow-x: auto;
            overflow-y: hidden;
            border-left: none;
            border-top: 1px solid rgba(238,241,255,0.1);
            padding: 14px 16px;
            gap: 10px;
          }
          .wg-thumb {
            width: 72px;
            height: 54px;
          }
          .wg-thumb:hover, .wg-thumb-active {
            transform: translateY(-4px) !important;
          }
        }

        @media (max-width: 480px) {
          .wg-title { font-size: 1.75rem; }
          .wg-image-wrap { max-width: 94%; }
        }
      `}</style>

      {/* Background layers */}
      <div
        ref={bgARef}
        className="wg-bg wg-bg-a"
        style={{ backgroundImage: `url(${projects[bgFrontIndex].image})` }}
        aria-hidden="true"
      />
      <div
        ref={bgBRef}
        className="wg-bg wg-bg-b"
        style={{ backgroundImage: `url(${projects[bgFrontIndex].image})` }}
        aria-hidden="true"
      />
      <div className="wg-overlay" aria-hidden="true" />
      <div className="wg-grain" aria-hidden="true" />

      <SiteNav />

      <div className="wg-layout">
        <aside className="wg-sidebar">
          <div className="wg-brand-block">
            <div className="wg-accent-line" />
            <h1 className="wg-brand">{brandName}</h1>
            <p className="wg-brand-label">{t.works.brandLabel}</p>
          </div>
          <p className="wg-intro">{t.works.brandIntro}</p>
        </aside>

        <main className="wg-main" aria-label={t.works.galleryAria}>
          <div className="wg-info">
            <p ref={categoryRef} className="wg-category">
              {lx(locale, project.category)}
            </p>
            <p ref={counterRef} className="wg-counter">
              {padIndex(activeIndex)} / {String(total).padStart(2, "0")}
            </p>
            <h2 ref={titleRef} className="wg-title">{project.title}</h2>
            <p ref={descRef} className="wg-desc">
              {lx(locale, project.description)}
            </p>
            <div ref={dividerRef} className="wg-divider" />
            <div ref={creditsRef} className="wg-credits">
              <div>
                <p className="wg-credit-label">{t.works.role}</p>
                <p className="wg-credit-name">{lx(locale, project.creativeLead)}</p>
              </div>
              <div>
                <p className="wg-credit-label">{t.works.stack}</p>
                <p className="wg-credit-name">{project.visualArtist}</p>
              </div>
            </div>
          </div>

          <div className="wg-preview-zone">
            <button
              type="button"
              className="wg-arrow"
              onClick={goPrev}
              disabled={activeIndex === 0 || isTransitioning}
              aria-label={t.works.prev}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <a
              ref={imageWrapRef}
              className="wg-image-wrap"
              href={project.href ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${project.title} website`}
              onClick={(e) => {
                if (!project.href) e.preventDefault();
              }}
            >
              <img
                ref={imageRef}
                className="wg-image"
                src={project.image}
                alt={`${project.title} — ${lx(locale, project.category)}`}
                draggable={false}
                loading={activeIndex < PRELOAD_COUNT ? "eager" : "lazy"}
              />
              <div className="wg-image-grad-top" />
              <div className="wg-image-grad-bottom" />
              <div className="wg-image-meta">
                <span className="wg-story-label">{t.works.liveProject}</span>
                <span className="wg-year">{CURRENT_YEAR}</span>
                <span className="wg-explore">
                  {t.works.visitSite}
                  <span className="wg-explore-icon" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M7 17L17 7M17 7H9M17 7v8" />
                    </svg>
                  </span>
                </span>
              </div>
            </a>

            <button
              type="button"
              className="wg-arrow"
              onClick={goNext}
              disabled={activeIndex >= total - 1 || isTransitioning}
              aria-label={t.works.next}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </main>

        <div
          ref={thumbRailRef}
          className="wg-rail"
          role="tablist"
          aria-label={t.works.thumbsAria}
        >
          {projects.map((p, i) => (
            <button
              key={p.title}
              type="button"
              role="tab"
              data-thumb-index={i}
              className={`wg-thumb${i === activeIndex ? " wg-thumb-active" : ""}`}
              aria-label={`View project ${padIndex(i)}: ${p.title}`}
              aria-selected={i === activeIndex}
              aria-current={i === activeIndex ? "true" : undefined}
              onClick={() => goTo(i)}
            >
              <img
                src={p.image}
                alt=""
                draggable={false}
                loading={i < PRELOAD_COUNT + 2 ? "eager" : "lazy"}
              />
              <span className="wg-thumb-num">{padIndex(i)}</span>
              <span className="wg-thumb-progress" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
