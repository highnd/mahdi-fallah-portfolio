import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SiteNav from "./SiteNav";
import {
  KEXSIO_ACCENT,
  KEXSIO_BG,
  KEXSIO_TEAL,
  WORK_PLACES,
  type WorkPlace,
} from "./worksData";

gsap.registerPlugin(ScrollTrigger);

const MODE_LABEL: Record<WorkPlace["mode"], string> = {
  onsite: "حضوری",
  remote: "ریموت",
  hybrid: "هیبرید",
};

function pad(i: number) {
  return String(i + 1).padStart(2, "0");
}

type Particle = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  a: number;
};

function useHeroAtmosphere(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let t = 0;
    const particles: Particle[] = [];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      w = parent.clientWidth;
      h = parent.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      particles.length = 0;
      const count = Math.floor((w * h) / 14000);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.6 + Math.random() * 2.2,
          vx: -0.15 + Math.random() * 0.3,
          vy: -0.35 - Math.random() * 0.45,
          a: 0.15 + Math.random() * 0.55,
        });
      }
    };

    const draw = () => {
      t += 0.008;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < 4; i++) {
        const y = ((h * 0.15 * i + t * (18 + i * 7)) % (h + 160)) - 80;
        const g = ctx.createLinearGradient(0, y, 0, y + 140);
        g.addColorStop(0, "rgba(33,241,168,0)");
        g.addColorStop(0.5, `rgba(33,241,168,${0.035 + i * 0.01})`);
        g.addColorStop(1, "rgba(33,241,168,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, y, w, 140);
      }

      for (let i = 0; i < 3; i++) {
        const ox = w * (0.2 + i * 0.28) + Math.sin(t * 0.7 + i) * 60;
        const oy = h * (0.25 + i * 0.18) + Math.cos(t * 0.55 + i * 1.3) * 40;
        const rad = 90 + i * 40;
        const orb = ctx.createRadialGradient(ox, oy, 0, ox, oy, rad);
        orb.addColorStop(0, `rgba(33,241,168,${0.14 - i * 0.03})`);
        orb.addColorStop(0.45, `rgba(0,71,65,${0.1 - i * 0.02})`);
        orb.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = orb;
        ctx.beginPath();
        ctx.arc(ox, oy, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const p of particles) {
        p.x += p.vx + Math.sin(t + p.y * 0.01) * 0.12;
        p.y += p.vy;
        if (p.y < -10) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        ctx.beginPath();
        ctx.fillStyle = `rgba(232,255,248,${p.a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.strokeStyle = "rgba(33,241,168,0.22)";
      ctx.lineWidth = 1.5;
      for (let x = 0; x <= w; x += 8) {
        const y =
          h * 0.62 +
          Math.sin(x * 0.008 + t * 1.4) * 28 +
          Math.sin(x * 0.02 - t) * 12;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [canvasRef, enabled]);
}

export default function ExperiencePage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeBandRef = useRef(-1);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const jobs = WORK_PLACES;
  const job = jobs[active] ?? jobs[0];

  const years = useMemo(
    () => jobs.map((j) => j.period.split("—")[0]?.trim() || j.period),
    [jobs],
  );

  useHeroAtmosphere(canvasRef, true);

  useEffect(() => {
    const root = rootRef.current;
    const pin = pinRef.current;
    if (!root || !pin) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = () => window.matchMedia("(max-width: 900px)").matches;

    const ctx = gsap.context(() => {
      if (!reduced) {
        gsap.from(".ex-hero-anim", {
          y: 28,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          clearProps: "all",
        });
      }

      const st = ScrollTrigger.create({
        trigger: pin,
        start: "top top",
        end: () => `+=${Math.max(jobs.length, 1) * (mobile() ? 72 : 95)}%`,
        pin: !mobile(),
        pinSpacing: true,
        scrub: reduced ? false : 0.55,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress;
          setProgress(p);
          const band =
            p >= 0.999
              ? jobs.length - 1
              : Math.min(jobs.length - 1, Math.floor(p * jobs.length));
          if (band !== activeBandRef.current) {
            activeBandRef.current = band;
            setActive(band);
          }
          if (fillRef.current) {
            fillRef.current.style.transform = `scaleY(${Math.max(0.04, p)})`;
          }
        },
      });

      const observers: IntersectionObserver[] = [];
      if (mobile()) {
        st.kill();
        const cards = root.querySelectorAll<HTMLElement>(".ex-card");
        cards.forEach((card, i) => {
          const io = new IntersectionObserver(
            ([entry]) => {
              if (entry.isIntersecting) {
                activeBandRef.current = i;
                setActive(i);
                setProgress((i + 0.5) / jobs.length);
                if (fillRef.current) {
                  fillRef.current.style.transform = `scaleY(${(i + 1) / jobs.length})`;
                }
              }
            },
            { root: null, threshold: 0.45, rootMargin: "-10% 0px -35% 0px" },
          );
          io.observe(card);
          observers.push(io);
        });
      }

      const onResize = () => ScrollTrigger.refresh();
      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("resize", onResize);
        observers.forEach((o) => o.disconnect());
      };
    }, root);

    return () => ctx.revert();
  }, [jobs.length]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 900px)").matches;
    if (reduced || mobile) return;

    gsap.fromTo(
      stage,
      { y: 18, opacity: 0.35 },
      { y: 0, opacity: 1, duration: 0.45, ease: "power2.out", overwrite: true },
    );
  }, [active]);

  const goTo = (index: number) => {
    const clamped = Math.max(0, Math.min(jobs.length - 1, index));
    activeBandRef.current = clamped;
    setActive(clamped);

    const pin = pinRef.current;
    if (!pin) return;
    const mobile = window.matchMedia("(max-width: 900px)").matches;
    if (mobile) {
      document.getElementById(`ex-card-${jobs[clamped].id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    const st = ScrollTrigger.getAll().find((t) => t.trigger === pin);
    if (!st) return;
    const target =
      st.start + (st.end - st.start) * ((clamped + 0.35) / jobs.length);
    window.scrollTo({ top: target, behavior: "smooth" });
  };

  return (
    <div
      ref={rootRef}
      className="ex-root"
      lang="fa"
      style={
        {
          "--ex-accent": KEXSIO_ACCENT,
          "--ex-bg": KEXSIO_BG,
          "--ex-teal": KEXSIO_TEAL,
          "--ex-progress": String(progress),
        } as React.CSSProperties
      }
    >
      <style>{`
        .ex-root {
          position: relative;
          min-height: 100svh;
          background:
            radial-gradient(90% 55% at 50% -10%, rgba(0,71,65,0.35), transparent 58%),
            radial-gradient(70% 45% at 85% 100%, rgba(33,241,168,0.07), transparent 52%),
            var(--ex-bg);
          color: #e8fff8;
          font-family: "Vazirmatn", "Sora", system-ui, sans-serif;
          direction: rtl;
          text-align: right;
          overflow-x: hidden;
        }

        .ex-hero {
          position: relative;
          min-height: 88svh;
          display: grid;
          align-content: center;
          justify-items: center;
          padding: clamp(100px, 14vh, 140px) clamp(20px, 5vw, 64px) clamp(56px, 10vh, 88px);
          overflow: hidden;
          isolation: isolate;
          text-align: center;
        }
        .ex-hero::after {
          content: "";
          position: absolute;
          z-index: 2;
          inset-inline: 0;
          bottom: 0;
          height: min(32vh, 220px);
          pointer-events: none;
          background: linear-gradient(180deg, transparent 0%, var(--ex-bg) 92%);
        }
        .ex-hero-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          background: center / cover no-repeat url("/experience-hero.jpg");
          transform: scale(1.08);
          animation: ex-bg-breathe 22s ease-in-out infinite alternate;
        }
        .ex-hero-canvas {
          position: absolute;
          inset: 0;
          z-index: 1;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        .ex-hero-veil {
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          background:
            linear-gradient(180deg, rgba(12,16,15,0.35) 0%, rgba(12,16,15,0.5) 45%, rgba(23,23,23,0.88) 100%),
            radial-gradient(65% 50% at 50% 38%, rgba(33,241,168,0.14), transparent 58%);
        }
        @keyframes ex-bg-breathe {
          0% { transform: scale(1.06) translate3d(0,0,0); }
          100% { transform: scale(1.14) translate3d(-1.5%, 1%, 0); }
        }
        .ex-hero-inner {
          position: relative;
          z-index: 3;
          width: min(100%, 980px);
          margin-inline: auto;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .ex-kicker {
          margin: 0 0 18px;
          color: var(--ex-accent);
          font-size: clamp(12px, 1.2vw, 14px);
          letter-spacing: 0.12em;
        }
        .ex-title {
          margin: 0;
          font-size: clamp(3.4rem, 11vw, 7.2rem);
          font-weight: 800;
          line-height: 0.95;
          letter-spacing: -0.04em;
        }
        .ex-title em {
          font-style: normal;
          color: transparent;
          -webkit-text-stroke: 1.35px rgba(232,255,248,0.72);
        }
        .ex-lede {
          margin: 1.35rem 0 0;
          max-width: 48ch;
          color: #c5ddd4;
          line-height: 1.8;
          font-size: clamp(1.05rem, 1.8vw, 1.28rem);
        }
        .ex-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 1.75rem;
          justify-content: center;
        }
        .ex-stat {
          border: 1px solid rgba(232,255,248,0.14);
          background: rgba(0,71,65,0.25);
          padding: 8px 12px;
          font-size: 12px;
          color: #b8d4cc;
        }
        .ex-stat b { color: var(--ex-accent); }
        .ex-start {
          margin-top: 2rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          border: 0;
          background: none;
          color: #9fbab2;
          font: inherit;
          font-size: 12px;
          letter-spacing: 0.06em;
          cursor: pointer;
          padding: 8px 0;
        }
        .ex-start:hover { color: var(--ex-accent); }
        .ex-start i {
          width: 1px;
          height: 36px;
          background: linear-gradient(180deg, var(--ex-accent), transparent);
          display: block;
          animation: ex-pulse 1.8s ease-in-out infinite;
        }
        @keyframes ex-pulse {
          0%, 100% { opacity: 0.35; transform: scaleY(0.85); }
          50% { opacity: 1; transform: scaleY(1); }
        }

        .ex-pin {
          position: relative;
          min-height: 100svh;
          display: grid;
          grid-template-columns: 92px minmax(0, 1.05fr) minmax(280px, 0.9fr);
          gap: clamp(16px, 3vw, 36px);
          padding: 88px clamp(16px, 4vw, 48px) 40px;
          box-sizing: border-box;
          background:
            radial-gradient(55% 45% at 12% 18%, rgba(0,71,65,0.28), transparent 62%),
            transparent;
        }
        .ex-pin::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background: linear-gradient(180deg, var(--ex-bg) 0%, transparent 12%, transparent 88%, var(--ex-bg) 100%);
        }
        .ex-pin > * { position: relative; z-index: 1; }

        .ex-nav {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0 20px;
          min-height: calc(100svh - 140px);
        }
        .ex-nav-track {
          position: absolute;
          top: 24px;
          bottom: 24px;
          width: 2px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(232,255,248,0.1);
          border-radius: 99px;
          overflow: hidden;
          z-index: 0;
        }
        .ex-nav-fill {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, #21f1a8, #004741);
          transform: scaleY(0.04);
          transform-origin: top center;
          will-change: transform;
        }
        .ex-dot {
          position: relative;
          z-index: 1;
          width: 42px;
          height: 42px;
          border-radius: 999px;
          border: 1px solid rgba(232,255,248,0.18);
          background: rgba(12,18,17,0.95);
          color: #8eaaa2;
          font-family: "Sora", sans-serif;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.25s ease;
          direction: ltr;
        }
        .ex-dot:hover,
        .ex-dot[aria-current="true"] {
          color: #0a1412;
          background: var(--ex-accent);
          border-color: var(--ex-accent);
          transform: scale(1.08);
        }
        .ex-dot:focus-visible {
          outline: 2px solid var(--ex-accent);
          outline-offset: 3px;
        }

        .ex-stage {
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: calc(100svh - 140px);
        }
        .ex-stage-index {
          margin: 0;
          font-family: "Sora", sans-serif;
          font-size: clamp(3.2rem, 8vw, 6rem);
          font-weight: 800;
          line-height: 0.9;
          color: transparent;
          -webkit-text-stroke: 1.2px rgba(33,241,168,0.4);
          direction: ltr;
          text-align: right;
        }
        .ex-stage-company {
          margin: 8px 0 0;
          font-size: clamp(2rem, 4.5vw, 3.2rem);
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }
        .ex-stage-company a {
          color: inherit;
          text-decoration: none;
        }
        .ex-stage-company a:hover { color: var(--ex-accent); }
        .ex-stage-role {
          margin: 12px 0 0;
          font-size: 1.1rem;
          color: #b8d4cc;
        }
        .ex-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 18px;
        }
        .ex-chip {
          font-size: 11px;
          padding: 7px 11px;
          border: 1px solid rgba(232,255,248,0.14);
          color: #a9c4bc;
          background: rgba(0,0,0,0.18);
        }
        .ex-chip-on {
          color: var(--ex-accent);
          border-color: rgba(33,241,168,0.4);
          background: rgba(33,241,168,0.08);
        }
        .ex-quote {
          margin: 22px 0 0;
          padding: 14px 16px;
          border-right: 2px solid var(--ex-accent);
          background: linear-gradient(270deg, rgba(33,241,168,0.1), transparent 80%);
          line-height: 1.7;
          font-size: 0.98rem;
        }
        .ex-body {
          margin: 16px 0 0;
          max-width: 48ch;
          color: #c5ddd4;
          line-height: 1.8;
          font-size: 0.98rem;
        }
        .ex-stack {
          list-style: none;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 22px 0 0;
          padding: 0;
        }
        .ex-stack li {
          font-size: 12px;
          color: #d5efe7;
          border: 1px solid rgba(232,255,248,0.16);
          background: rgba(33,241,168,0.06);
          padding: 6px 10px;
          direction: ltr;
        }
        .ex-controls {
          display: flex;
          gap: 10px;
          margin-top: 28px;
        }
        .ex-ctrl {
          min-width: 48px;
          min-height: 48px;
          border: 1px solid rgba(232,255,248,0.2);
          background: rgba(12,18,17,0.6);
          color: #e8fff8;
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: 0.2s ease;
        }
        .ex-ctrl:hover:not(:disabled) {
          border-color: var(--ex-accent);
          color: var(--ex-accent);
        }
        .ex-ctrl:disabled { opacity: 0.3; cursor: not-allowed; }
        .ex-ctrl svg { width: 18px; height: 18px; }

        .ex-visual {
          position: relative;
          min-height: calc(100svh - 160px);
          border: 1px solid rgba(232,255,248,0.1);
          overflow: hidden;
          background: #0c1211;
        }
        .ex-visual-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .ex-visual::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(80% 70% at 20% 15%, rgba(33,241,168,0.2), transparent 55%),
            linear-gradient(180deg, transparent 35%, rgba(10,14,14,0.85));
          pointer-events: none;
        }
        .ex-visual-foot {
          position: absolute;
          z-index: 1;
          inset-inline: 18px;
          bottom: 18px;
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 12px;
          direction: ltr;
        }
        .ex-visual-foot strong {
          display: block;
          font-family: "Sora", sans-serif;
          font-size: 1.25rem;
          margin-bottom: 4px;
        }
        .ex-visual-foot span { color: #b8d4cc; font-size: 12px; }
        .ex-meter {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          border: 1px solid rgba(33,241,168,0.35);
          background: rgba(12,18,17,0.55);
          backdrop-filter: blur(8px);
          font-family: "Sora", sans-serif;
          font-weight: 700;
          color: var(--ex-accent);
        }

        .ex-mobile-list { display: none; }

        .ex-cta-wrap {
          position: relative;
          margin: clamp(48px, 8vh, 88px) clamp(16px, 4vw, 48px) clamp(72px, 10vh, 100px);
          overflow: visible;
        }
        .ex-cta-art {
          position: absolute;
          z-index: 4;
          left: clamp(10px, 2.5vw, 28px);
          right: auto;
          top: -18%;
          bottom: auto;
          width: min(300px, 34vw);
          margin: 0;
          padding: 0;
          pointer-events: none;
          background: transparent !important;
          border: 0;
          box-shadow: none;
          overflow: visible;
        }
        .ex-cta-art img {
          width: 100%;
          height: auto;
          display: block;
          object-fit: contain;
          background: transparent;
          mix-blend-mode: normal;
          filter: drop-shadow(0 18px 40px rgba(0, 0, 0, 0.55));
        }
        .ex-cta {
          position: relative;
          z-index: 1;
          margin: 0;
          min-height: clamp(220px, 28vw, 300px);
          padding: clamp(32px, 5vw, 56px);
          padding-left: min(42%, 360px);
          padding-right: clamp(24px, 4vw, 48px);
          border: 1px solid rgba(232,255,248,0.1);
          background:
            radial-gradient(85% 100% at 100% 0%, rgba(33,241,168,0.1), transparent 55%),
            radial-gradient(60% 80% at 0% 100%, rgba(0,71,65,0.2), transparent 50%),
            rgba(23,23,23,0.92);
          backdrop-filter: blur(6px);
          overflow: visible;
        }
        .ex-cta h2 {
          margin: 0;
          font-size: clamp(1.7rem, 3.5vw, 2.5rem);
          font-weight: 800;
        }
        .ex-cta p {
          margin: 12px 0 0;
          max-width: 42ch;
          color: #c5ddd4;
          line-height: 1.7;
        }
        .ex-cta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 24px;
        }
        .ex-btn {
          min-height: 48px;
          padding: 0 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s ease;
        }
        .ex-btn-primary {
          background: var(--ex-accent);
          color: #0a1412;
          border: 1px solid var(--ex-accent);
        }
        .ex-btn-ghost {
          background: transparent;
          color: #e8fff8;
          border: 1px solid rgba(232,255,248,0.25);
        }
        .ex-btn-ghost:hover {
          color: var(--ex-accent);
          border-color: var(--ex-accent);
        }

        @media (max-width: 900px) {
          .ex-pin {
            display: block;
            min-height: auto;
            padding: 24px 16px 8px;
            background: transparent;
          }
          .ex-nav {
            position: sticky;
            top: 64px;
            z-index: 30;
            min-height: auto;
            flex-direction: row;
            justify-content: flex-start;
            gap: 8px;
            overflow-x: auto;
            padding: 10px 4px;
            margin: 0 -4px 18px;
            background: rgba(12,18,17,0.9);
            backdrop-filter: blur(14px);
            border-bottom: 1px solid rgba(232,255,248,0.1);
          }
          .ex-nav-track { display: none; }
          .ex-stage, .ex-visual { display: none; }
          .ex-mobile-list {
            display: flex;
            flex-direction: column;
            gap: 18px;
            padding-bottom: 24px;
          }
          .ex-card {
            border: 1px solid rgba(232,255,248,0.12);
            padding: 22px 18px;
            background:
              linear-gradient(160deg, rgba(18,28,26,0.95), rgba(12,16,15,0.98));
          }
          .ex-card[data-active="true"] {
            border-color: rgba(33,241,168,0.45);
            box-shadow: 0 0 0 1px rgba(33,241,168,0.12);
          }
          .ex-card-top {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            gap: 12px;
            margin-bottom: 8px;
          }
          .ex-card-num {
            font-family: "Sora", sans-serif;
            color: var(--ex-accent);
            font-weight: 700;
            direction: ltr;
          }
          .ex-card-media {
            margin: 14px 0 0;
            border: 1px solid rgba(232,255,248,0.1);
            overflow: hidden;
            min-height: 180px;
          }
          .ex-card-media img {
            width: 100%;
            height: 200px;
            object-fit: cover;
            display: block;
          }
          .ex-cta-wrap {
            margin: 56px 14px 56px;
          }
          .ex-cta-art {
            left: 50%;
            width: min(220px, 58vw);
            top: -22%;
            transform: translateX(-50%);
          }
          .ex-cta {
            padding-left: clamp(20px, 4vw, 28px);
            padding-right: clamp(20px, 4vw, 28px);
            padding-top: clamp(120px, 36vw, 160px);
            text-align: center;
            min-height: auto;
          }
          .ex-cta p { margin-inline: auto; }
          .ex-cta-row { justify-content: center; }
        }

        @media (prefers-reduced-motion: reduce) {
          .ex-hero-bg, .ex-start i, .ex-dot, .ex-btn, .ex-ctrl { animation: none !important; transition: none !important; }
          .ex-hero-canvas { display: none; }
        }
      `}</style>

      <SiteNav />

      <header className="ex-hero">
        <div className="ex-hero-bg" aria-hidden="true" />
        <canvas ref={canvasRef} className="ex-hero-canvas" aria-hidden="true" />
        <div className="ex-hero-veil" aria-hidden="true" />
        <div className="ex-hero-inner">
          <p className="ex-kicker ex-hero-anim">مسیر حرفه‌ای · ۶+ سال</p>
          <h1 className="ex-title ex-hero-anim">
            جایی که
            <br />
            <em>کار کردم</em>
          </h1>
          <p className="ex-lede ex-hero-anim">
            از کارآموزی در Taftaco تا Senior حضوری در Sol، همکاری با OsloWeb نروژ و بنیان‌گذاری EasyCodePie.
          </p>
          <div className="ex-stats ex-hero-anim">
            <span className="ex-stat">
              <b>{jobs.length}</b> ایستگاه
            </span>
            <span className="ex-stat">
              <b>Sol</b> · Senior · حضوری
            </span>
            <span className="ex-stat">
              <b>OsloWeb</b> · Norway
            </span>
          </div>
          <button type="button" className="ex-start ex-hero-anim" onClick={() => goTo(0)}>
            شروع مسیر
            <i aria-hidden="true" />
          </button>
        </div>
      </header>

      <section className="ex-pin" ref={pinRef} aria-label="خط زمان سوابق کاری">
        <aside className="ex-nav" aria-label="ایستگاه‌های مسیر">
          <div className="ex-nav-track" aria-hidden="true">
            <div className="ex-nav-fill" ref={fillRef} />
          </div>
          {jobs.map((j, i) => (
            <button
              key={j.id}
              type="button"
              className="ex-dot"
              aria-current={active === i ? "true" : undefined}
              aria-label={`${pad(i)} ${j.company}`}
              onClick={() => goTo(i)}
            >
              {pad(i)}
            </button>
          ))}
        </aside>

        <div className="ex-stage" ref={stageRef} aria-live="polite">
          <p className="ex-stage-index" aria-hidden="true">
            {pad(active)}
          </p>
          <h2 className="ex-stage-company">
            {job.href ? (
              <a href={job.href} target="_blank" rel="noopener noreferrer">
                {job.company}
              </a>
            ) : (
              job.company
            )}
          </h2>
          <p className="ex-stage-role">{job.role}</p>
          <div className="ex-chips">
            <span className="ex-chip">{job.period}</span>
            <span className="ex-chip">{job.location}</span>
            <span className="ex-chip ex-chip-on">{MODE_LABEL[job.mode]}</span>
            {job.current ? <span className="ex-chip ex-chip-on">فعلی</span> : null}
          </div>
          <p className="ex-quote">{job.highlight}</p>
          <p className="ex-body">{job.summary}</p>
          <ul className="ex-stack" aria-label="فناوری‌ها">
            {job.stack.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <div className="ex-controls">
            <button
              type="button"
              className="ex-ctrl"
              aria-label="قبلی"
              disabled={active <= 0}
              onClick={() => goTo(active - 1)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
            <button
              type="button"
              className="ex-ctrl"
              aria-label="بعدی"
              disabled={active >= jobs.length - 1}
              onClick={() => goTo(active + 1)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
          </div>
        </div>

        <aside className="ex-visual" aria-hidden="true">
          <img
            key={job.id}
            className="ex-visual-img"
            src={job.image}
            alt=""
            loading="lazy"
          />
          <div className="ex-visual-foot">
            <div>
              <strong>{job.company}</strong>
              <span>
                {MODE_LABEL[job.mode]} · {years[active]}
              </span>
            </div>
            <div className="ex-meter">{Math.round(((active + 1) / jobs.length) * 100)}%</div>
          </div>
        </aside>

        <div className="ex-mobile-list">
          {jobs.map((j, i) => (
            <article
              key={j.id}
              id={`ex-card-${j.id}`}
              className="ex-card"
              data-active={active === i ? "true" : "false"}
            >
              <div className="ex-card-top">
                <h3 className="ex-stage-company" style={{ fontSize: "1.45rem", margin: 0 }}>
                  {j.company}
                </h3>
                <span className="ex-card-num">{pad(i)}</span>
              </div>
              <p className="ex-stage-role">{j.role}</p>
              <figure className="ex-card-media">
                <img src={j.image} alt={`${j.company} — ${j.role}`} loading="lazy" />
              </figure>
              <div className="ex-chips">
                <span className="ex-chip">{j.period}</span>
                <span className="ex-chip">{j.location}</span>
                <span className="ex-chip ex-chip-on">{MODE_LABEL[j.mode]}</span>
              </div>
              <p className="ex-quote">{j.highlight}</p>
              <p className="ex-body">{j.summary}</p>
              <ul className="ex-stack">
                {j.stack.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <div className="ex-cta-wrap">
        <section className="ex-cta">
          <figure className="ex-cta-art" aria-hidden="true">
            <img src="/experience-cta-mask.png?v=3" alt="" loading="lazy" decoding="async" />
          </figure>
          <h2>ایستگاه بعدی: همکاری جدی</h2>
          <p>
            برای محصول فول‌استک، معماری دقیق و اجرای بین‌المللی — از ایده تا انتشار در تماسم.
          </p>
          <div className="ex-cta-row">
            <Link className="ex-btn ex-btn-primary" to="/contact">
              شروع همکاری
            </Link>
            <Link className="ex-btn ex-btn-ghost" to="/works">
              نمونه‌کارها
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
