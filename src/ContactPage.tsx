import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { KEXSIO_ACCENT, KEXSIO_BG, KEXSIO_TEAL } from "./worksData";
import SiteNav from "./SiteNav";

type FormStatus = "idle" | "loading" | "success" | "error";

export default function ContactPage() {
  const formId = useId();
  const nameId = `${formId}-name`;
  const emailId = `${formId}-email`;
  const messageId = `${formId}-message`;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [error, setError] = useState("");
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

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("نام، ایمیل و توضیحات پروژه را کامل کنید.");
      setStatus("error");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("یک ایمیل معتبر وارد کنید تا بتوانیم پاسخ دهیم.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    await new Promise((r) => setTimeout(r, 900));
    setStatus("success");
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setMessage("");
    setStatus("idle");
    setError("");
  };

  return (
    <div
      className="ct-root"
      lang="fa"
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
          height: 100lvh;
          min-height: 100dvh;
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
          height: 100lvh;
          min-height: 100dvh;
          min-height: -webkit-fill-available;
          width: 100%;
          padding-top: 72px;
          box-sizing: border-box;
        }

        .ct-left {
          display: flex;
          flex-direction: column;
          border-right: 1px solid rgba(232,255,248,0.1);
          padding: 12px 36px 28px;
          min-width: 0;
          overflow: hidden;
          direction: rtl;
          text-align: right;
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
          text-transform: none;
          color: var(--ct-accent);
          margin: 0 0 18px;
        }
        .ct-display {
          font-family: "Vazirmatn", "Sora", sans-serif;
          font-weight: 800;
          text-transform: none;
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
          max-width: 38ch;
          font-size: clamp(0.95rem, 1.2vw, 1.1rem);
          line-height: 1.65;
          color: #c5ddd4;
          margin-right: 0;
          margin-left: auto;
        }

        .ct-meta {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          margin-top: 1.75rem;
          padding: 1.1rem 0 0;
          border-top: 1px solid rgba(232,255,248,0.14);
          flex-shrink: 0;
        }
        .ct-meta-label {
          font-size: 11px;
          letter-spacing: 0.04em;
          text-transform: none;
          color: #7a968e;
          margin: 0 0 6px;
        }
        .ct-meta a, .ct-meta p {
          margin: 0;
          color: #e8fff8;
          text-decoration: none;
          font-size: 0.9rem;
          word-break: break-word;
        }
        .ct-meta a:hover { color: var(--ct-accent); }
        .ct-meta a:focus-visible {
          outline: 2px solid var(--ct-accent);
          outline-offset: 3px;
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
          gap: 0;
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
          direction: rtl;
          text-align: right;
          -webkit-overflow-scrolling: touch;
        }

        .ct-panel {
          width: min(100%, 460px);
          margin: 0 auto;
        }
        .ct-panel-title {
          font-family: "Vazirmatn", "Sora", sans-serif;
          font-weight: 800;
          text-transform: none;
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

        .ct-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .ct-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ct-field label {
          font-size: 12px;
          letter-spacing: 0.02em;
          text-transform: none;
          color: #7a968e;
        }
        .ct-field input,
        .ct-field select,
        .ct-field textarea {
          width: 100%;
          box-sizing: border-box;
          background: rgba(23,23,23,0.55);
          border: 1px solid rgba(232,255,248,0.14);
          border-radius: 0;
          color: #e8fff8;
          font: inherit;
          font-size: 1rem;
          padding: 14px 14px;
          outline: none;
          transition: border-color 0.2s ease, background 0.2s ease;
          direction: rtl;
          text-align: right;
        }
        .ct-field input:hover,
        .ct-field select:hover,
        .ct-field textarea:hover {
          border-color: rgba(33,241,168,0.35);
        }
        .ct-field input:focus,
        .ct-field select:focus,
        .ct-field textarea:focus {
          border-color: var(--ct-accent);
          background: rgba(0,71,65,0.25);
        }
        .ct-field textarea {
          min-height: 120px;
          resize: vertical;
        }
        .ct-field select {
          cursor: pointer;
          appearance: none;
          background-image: linear-gradient(45deg, transparent 50%, var(--ct-accent) 50%),
            linear-gradient(135deg, var(--ct-accent) 50%, transparent 50%);
          background-position: 18px calc(50% - 3px), 12px calc(50% - 3px);
          background-size: 6px 6px, 6px 6px;
          background-repeat: no-repeat;
          padding-left: 36px;
        }

        .ct-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .ct-submit {
          margin-top: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          min-height: 52px;
          padding: 0 22px;
          border: none;
          background: var(--ct-accent);
          color: #0a1412;
          font-family: "Vazirmatn", "Sora", sans-serif;
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 0.02em;
          text-transform: none;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.2s ease, opacity 0.2s ease;
          width: 100%;
        }
        .ct-submit:hover:not(:disabled) {
          background: #6ff7c4;
          transform: translateY(-1px);
        }
        .ct-submit:active:not(:disabled) {
          transform: translateY(0) scale(0.98);
        }
        .ct-submit:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .ct-submit:focus-visible {
          outline: 2px solid #e8fff8;
          outline-offset: 3px;
        }
        .ct-submit svg { width: 16px; height: 16px; }

        .ct-feedback {
          min-height: 1.25rem;
          margin: 0;
          font-size: 0.85rem;
          color: #ff8f8f;
        }
        .ct-feedback[data-ok="true"] { color: var(--ct-accent); }

        .ct-success {
          border: 1px solid rgba(33,241,168,0.35);
          background: rgba(0,71,65,0.35);
          padding: 28px 24px;
        }
        .ct-success h2 {
          font-family: "Vazirmatn", "Sora", sans-serif;
          font-weight: 800;
          text-transform: none;
          font-size: 1.5rem;
          margin: 0 0 10px;
        }
        .ct-success p {
          margin: 0 0 22px;
          color: #9fbab2;
          line-height: 1.65;
        }
        .ct-ghost {
          background: transparent;
          border: 1px solid rgba(232,255,248,0.25);
          color: #e8fff8;
          min-height: 48px;
          padding: 0 18px;
          font-family: "Vazirmatn", "Sora", sans-serif;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.02em;
          text-transform: none;
          cursor: pointer;
          transition: border-color 0.2s ease, color 0.2s ease;
          width: 100%;
        }
        .ct-ghost:hover {
          border-color: var(--ct-accent);
          color: var(--ct-accent);
        }

        .ct-spin {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(10,20,18,0.25);
          border-top-color: #0a1412;
          border-radius: 50%;
          animation: ct-spin 0.7s linear infinite;
        }
        @keyframes ct-spin { to { transform: rotate(360deg); } }

        @media (prefers-reduced-motion: reduce) {
          .ct-marquee { transform: none !important; }
          .ct-spin { animation: none; border-top-color: transparent; }
          .ct-submit, .ct-ghost { transition: none; }
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
            border-right: none;
            border-bottom: 1px solid rgba(232,255,248,0.1);
            padding: 8px 18px 0;
            overflow: visible;
          }
          .ct-hero { padding: 24px 0 18px; }
          .ct-display { font-size: clamp(2.1rem, 11vw, 3.2rem); line-height: 1.08; }
          .ct-lede { max-width: 100%; margin-left: 0; }
          .ct-meta { grid-template-columns: 1fr; gap: 14px; }
          .ct-marquee-wrap { margin: 16px -18px 0; }
          .ct-right {
            padding: 24px 18px calc(28px + env(safe-area-inset-bottom, 0px));
            justify-content: flex-start;
          }
          .ct-panel { width: 100%; }
          .ct-row { grid-template-columns: 1fr; }
          .ct-panel-sub { margin-bottom: 22px; }
        }

        @media (max-width: 480px) {
          .ct-left { padding: 4px 14px 0; }
          .ct-right { padding: 20px 14px calc(24px + env(safe-area-inset-bottom, 0px)); }
          .ct-marquee-wrap { margin: 14px -14px 0; }
          .ct-display { font-size: clamp(1.9rem, 12vw, 2.6rem); }
          .ct-kicker { font-size: 11px; }
          .ct-field input,
          .ct-field select,
          .ct-field textarea { font-size: 16px; } /* avoid iOS zoom */
        }
      `}</style>

      <SiteNav />
      <div className="ct-glow" aria-hidden="true" />
      <div className="ct-grid" aria-hidden="true" />

      <div className="ct-layout">
        <aside className="ct-left">
          <div className="ct-hero">
            <p className="ct-kicker">آماده همکاری · ۲۰۲۶</p>
            <h1 className="ct-display">
              شروع
              <br />
              یک همکاری
              <br />
              <span className="ct-outline">جدی</span>
            </h1>
            <p className="ct-lede">
              از ایده تا محصول — فول‌استک، معماری بک‌اند و رابط‌های غوطه‌ور با اجرای دقیق.
            </p>

            <div className="ct-meta">
              <div>
                <p className="ct-meta-label">ایمیل</p>
                <a href="mailto:highnd32@gmail.com" dir="ltr">highnd32@gmail.com</a>
              </div>
              <div>
                <p className="ct-meta-label">تلفن</p>
                <a href="tel:+989924021299" dir="ltr">0992 402 1299</a>
              </div>
              <div>
                <p className="ct-meta-label">گیت‌هاب</p>
                <a href="https://github.com/highnd" target="_blank" rel="noreferrer" dir="ltr">
                  github.com/highnd
                </a>
              </div>
            </div>
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
            {status === "success" ? (
              <div className="ct-success" role="status" aria-live="polite">
                <h2>پیام دریافت شد</h2>
                <p>
                  ممنون{name.trim() ? ` ${name.trim()}` : ""} — پیام شما خوانده می‌شود و به‌زودی
                  به {email.trim() || "ایمیلتان"} پاسخ داده خواهد شد.
                </p>
                <button type="button" className="ct-ghost" onClick={resetForm}>
                  ارسال پیام دیگر
                </button>
              </div>
            ) : (
              <>
                <h2 className="ct-panel-title">درخواست پروژه</h2>
                <p className="ct-panel-sub">
                  چند جزئیات کافی است. معمولاً ظرف چند روز پاسخ می‌دهیم.
                </p>
                <form className="ct-form" onSubmit={onSubmit} noValidate>
                  <div className="ct-row">
                    <div className="ct-field">
                      <label htmlFor={nameId}>نام</label>
                      <input
                        id={nameId}
                        name="name"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="ct-field">
                      <label htmlFor={emailId}>ایمیل</label>
                      <input
                        id={emailId}
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        dir="ltr"
                        style={{ textAlign: "left" }}
                      />
                    </div>
                  </div>

                  <div className="ct-field">
                    <label htmlFor={messageId}>درباره پروژه‌تان بگویید</label>
                    <textarea
                      id={messageId}
                      name="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                    />
                  </div>

                  <p
                    className="ct-feedback"
                    role={status === "error" ? "alert" : undefined}
                  >
                    {status === "error" ? error : ""}
                  </p>

                  <button
                    type="submit"
                    className="ct-submit"
                    disabled={status === "loading"}
                    aria-busy={status === "loading"}
                  >
                    {status === "loading" ? (
                      <>
                        <span className="ct-spin" aria-hidden="true" />
                        در حال ارسال
                      </>
                    ) : (
                      <>
                        ارسال پیام
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" style={{ transform: "scaleX(-1)" }}>
                          <path d="M7 17L17 7M17 7H9M17 7v8" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
