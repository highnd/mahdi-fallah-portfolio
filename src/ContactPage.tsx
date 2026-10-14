import { useEffect, useRef } from "react";
import { KEXSIO_ACCENT, KEXSIO_BG, KEXSIO_TEAL } from "./worksData";
import SiteNav from "./SiteNav";
import { useLocale } from "./i18n/LocaleContext";
import { PERSON } from "./seo/site";

export default function ContactPage() {
  const { locale, dir, t } = useLocale();
  const reducedRef = useRef(false);
  const marqueeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;

    const syncOverflow = () => {
      const mobile = window.matchMedia("(max-width: 920px)").matches;
      html.style.overflow = mobile ? "" : "hidden";
      body.style.overflow = mobile ? "" : "hidden";
    };
    syncOverflow();
    window.addEventListener("resize", syncOverflow);
    return () => {
      window.removeEventListener("resize", syncOverflow);
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);

  useEffect(() => {
    if (reducedRef.current || !marqueeRef.current) return;
    const el = marqueeRef.current;
    let raf = 0;
    let x = 0;
    const speed = 0.35;
    const tick = () => {
      x -= speed;
      const half = el.scrollWidth / 2;
      if (half > 0 && -x >= half) x += half;
      el.style.transform = `translate3d(${x}px,0,0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="ct-root"
      lang={locale}
      dir={dir}
      style={
        {
          "--ct-accent": KEXSIO_ACCENT,
          "--ct-bg": KEXSIO_BG,
          "--ct-teal": KEXSIO_TEAL,
        } as React.CSSProperties
      }
    >
      <style>{`
        .ct-root {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          height: 100svh;
          height: 100dvh;
          min-height: -webkit-fill-available;
          overflow: hidden;
          background: var(--ct-bg);
          color: #e8fff8;
          font-family: "Vazirmatn", "Sora", system-ui, sans-serif;
        }

        .ct-glow {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(90% 70% at 12% 20%, rgba(33,241,168,0.14) 0%, transparent 55%),
            radial-gradient(70% 60% at 88% 75%, rgba(0,71,65,0.55) 0%, transparent 50%),
            linear-gradient(160deg, #171717 0%, #121c1a 45%, #0e1514 100%);
        }

        .ct-grid {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.18;
          background-image:
            linear-gradient(rgba(232,255,248,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(232,255,248,0.06) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(ellipse at center, #000 30%, transparent 75%);
        }

        .ct-layout {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          height: 100%;
          height: 100svh;
          height: 100dvh;
          min-height: -webkit-fill-available;
          width: 100%;
          padding-top: 72px;
          box-sizing: border-box;
        }

        .ct-left {
          display: flex;
          flex-direction: column;
          border-inline-end: 1px solid rgba(232,255,248,0.1);
          padding: 12px 36px 28px;
          min-width: 0;
          overflow: hidden;
          text-align: start;
          position: relative;
          isolation: isolate;
          background:
            linear-gradient(160deg, rgba(10,14,14,0.78) 0%, rgba(12,18,17,0.72) 45%, rgba(8,12,12,0.82) 100%),
            center / cover no-repeat url("/contact-left-bg.jpg");
        }
        .ct-left::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background:
            radial-gradient(90% 70% at 80% 20%, rgba(33,241,168,0.12) 0%, transparent 50%),
            linear-gradient(180deg, rgba(10,12,12,0.35) 0%, rgba(10,12,12,0.55) 55%, rgba(10,12,12,0.75) 100%);
        }
        .ct-left > * {
          position: relative;
          z-index: 1;
        }

        .ct-hero {
          flex: 1 1 auto;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          min-height: 0;
          padding: clamp(28px, 7vh, 88px) 0 24px;
          gap: 0;
        }
        .ct-kicker {
          font-size: 12px;
          letter-spacing: 0.06em;
          color: var(--ct-accent);
          margin: 0 0 18px;
        }
        .ct-display {
          font-family: "Vazirmatn", "Sora", sans-serif;
          font-weight: 800;
          font-size: clamp(2.4rem, 6.5vw, 5.4rem);
          line-height: 1.05;
          letter-spacing: -0.02em;
          margin: 0;
        }
        .ct-outline {
          color: transparent;
          -webkit-text-stroke: 1.5px rgba(232,255,248,0.72);
        }
        .ct-lede {
          margin-top: 1.5rem;
          max-width: 40ch;
          font-size: clamp(0.95rem, 1.2vw, 1.1rem);
          line-height: 1.65;
          color: #c5ddd4;
        }

        .ct-marquee-wrap {
          flex-shrink: 0;
          overflow: hidden;
          border-top: 1px solid rgba(232,255,248,0.1);
          margin: 0 -36px -28px;
          padding: 14px 0;
          background: rgba(0,71,65,0.35);
          direction: ltr;
          text-align: left;
        }
        .ct-marquee {
          display: flex;
          width: max-content;
          will-change: transform;
          white-space: nowrap;
          font-family: "Sora", sans-serif;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--ct-accent);
        }
        .ct-marquee span { padding: 0 1.4rem; }

        .ct-right {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 40px clamp(20px, 4vw, 48px);
          min-width: 0;
          overflow-y: auto;
          text-align: start;
          -webkit-overflow-scrolling: touch;
        }

        .ct-panel {
          width: min(100%, 460px);
          margin: 0 auto;
        }
        .ct-panel-title {
          font-family: "Vazirmatn", "Sora", sans-serif;
          font-weight: 800;
          font-size: clamp(1.35rem, 2.4vw, 1.85rem);
          letter-spacing: -0.01em;
          margin: 0 0 8px;
        }
        .ct-panel-sub {
          margin: 0 0 28px;
          color: #9fbab2;
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .ct-cards {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .ct-card {
          display: block;
          padding: 18px 20px;
          border: 1px solid rgba(232,255,248,0.14);
          background: rgba(23,23,23,0.45);
          text-decoration: none;
          color: inherit;
          transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
        }
        .ct-card:hover {
          border-color: rgba(33,241,168,0.45);
          background: rgba(0,71,65,0.28);
          transform: translateY(-1px);
        }
        .ct-card:focus-visible {
          outline: 2px solid var(--ct-accent);
          outline-offset: 3px;
        }
        .ct-card-label {
          margin: 0 0 6px;
          font-size: 11px;
          letter-spacing: 0.04em;
          color: #7a968e;
        }
        .ct-card-value {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 600;
          color: #e8fff8;
          word-break: break-word;
        }
        .ct-card:hover .ct-card-value {
          color: var(--ct-accent);
        }

        @media (prefers-reduced-motion: reduce) {
          .ct-marquee { transform: none !important; }
          .ct-card { transition: none; }
        }

        @media (max-width: 920px) {
          .ct-root {
            overflow: auto;
            height: auto;
            min-height: 100svh;
            position: relative;
          }
          .ct-layout {
            grid-template-columns: 1fr;
            height: auto;
            min-height: 100svh;
            padding-top: 64px;
          }
          .ct-left {
            border-inline-end: none;
            border-bottom: 1px solid rgba(232,255,248,0.1);
            padding: 8px 18px 0;
            overflow: visible;
          }
          .ct-hero { padding: 24px 0 18px; }
          .ct-display { font-size: clamp(2.1rem, 11vw, 3.2rem); line-height: 1.08; }
          .ct-lede { max-width: 100%; }
          .ct-marquee-wrap { margin: 16px -18px 0; }
          .ct-right {
            padding: 24px 18px calc(28px + env(safe-area-inset-bottom, 0px));
            justify-content: flex-start;
          }
          .ct-panel { width: 100%; }
        }
      `}</style>

      <SiteNav />
      <div className="ct-glow" aria-hidden="true" />
      <div className="ct-grid" aria-hidden="true" />

      <div className="ct-layout">
        <aside className="ct-left">
          <div className="ct-hero">
            <p className="ct-kicker">{t.contact.kicker}</p>
            <h1 className="ct-display">
              {t.contact.titleLine1}
              <br />
              {t.contact.titleLine2}
              <br />
              <span className="ct-outline">{t.contact.titleOutline}</span>
            </h1>
            <p className="ct-lede">{t.contact.lede}</p>
          </div>

          <div className="ct-marquee-wrap" aria-hidden="true">
            <div className="ct-marquee" ref={marqueeRef}>
              {Array.from({ length: 2 }).map((_, copy) => (
                <span key={copy}>
                  <span>WebGL</span>
                  <span>·</span>
                  <span>Motion</span>
                  <span>·</span>
                  <span>Brand Worlds</span>
                  <span>·</span>
                  <span>Interactive</span>
                  <span>·</span>
                  <span>Launch</span>
                  <span>·</span>
                </span>
              ))}
            </div>
          </div>
        </aside>

        <main className="ct-right" id="main">
          <div className="ct-panel">
            <h2 className="ct-panel-title">{t.contact.panelTitle}</h2>
            <p className="ct-panel-sub">{t.contact.panelSub}</p>
            <div className="ct-cards">
              <a className="ct-card" href={`mailto:${PERSON.email}`}>
                <p className="ct-card-label">{t.contact.email}</p>
                <p className="ct-card-value" dir="ltr">
                  {PERSON.email}
                </p>
              </a>
              <a className="ct-card" href={`tel:${PERSON.telephone}`}>
                <p className="ct-card-label">{t.contact.phone}</p>
                <p className="ct-card-value" dir="ltr">
                  {PERSON.telephoneDisplay}
                </p>
              </a>
              <a
                className="ct-card"
                href={PERSON.github}
                target="_blank"
                rel="noreferrer"
              >
                <p className="ct-card-label">{t.contact.github}</p>
                <p className="ct-card-value" dir="ltr">
                  github.com/{PERSON.githubHandle}
                </p>
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
