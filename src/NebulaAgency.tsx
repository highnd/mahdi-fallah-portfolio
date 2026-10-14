import { useEffect, useRef } from "react";
import * as THREE from "three";
import SiteNav from "./SiteNav";
import { useLocale } from "./i18n/LocaleContext";

/* ────────────────────────────────────────────────────────────────────────
   NEBULA — a full-page 3D particle agency website.

   One persistent fixed WebGL canvas holds a single field of ~56k glowing
   particles living in TRUE 3D space. As you scroll, the same field explodes
   outward into a deep starfield (particles fly in x/y/z — some toward the
   camera, growing big & bright; some far back, shrinking & dimming) and then
   magnetically re-forms into the next 3D object. The morph IS the hand-off
   between the nine sections:

     0 heroObject (devices) → 1 phdBooks (papers) → 2 scatteredGalaxy
     → 3 stackLayers (full-stack) → 4 systemDesign (layers) → 5 processTunnel
     → 6 skillOrbits → 7 blueprintGrid → 8 launchPad

   This is a direct UPGRADE of the project's `FluxMorph` technique: same single
   THREE.Points + hand-rolled rAF + scroll→progress morph core, extended with
   real depth scatter, a dollying perspective camera, mouse parallax, a fog
   depth-fade, and a persistent multi-colour palette (white / warm gold /
   electric blue / dim gray). No GSAP — the existing scroll system drives it.

   Standalone /preview/nebula : real scroll drives the journey (lerped).
   ?card : can't scroll, so the loop auto-plays it (ping-pong).
   prefers-reduced-motion : hold the settled hero object, no morph.
   ──────────────────────────────────────────────────────────────────────── */

const STOPS = 9;
const STAGGER = 0.34; // portion of each morph spent spreading arrivals
const CAM_Z = 15;
const FOV = 45;

// Per-station Y-spin speed (rad/s). Objects turn; scatters don't.
//        hero  phd  galaxy stack design tunnel orbits blueprint launch
const SPIN = [0.12, 0.07, 0.02, 0.1, 0.06, 0.0, 0.08, 0.04, 0.03];
const BREATHE = [1, 1, 0, 1, 1, 0, 1, 1, 1];

// Directional slide of each section's text while it eases in/out (px, never pops).
const SLIDE: [number, number][] = [
  [-22, 0], // 0 hero
  [22, 0], // 1 phd
  [0, 28], // 2 manifesto
  [22, 0], // 3 stack
  [-22, 0], // 4 system design
  [22, 0], // 5 process
  [0, 28], // 6 expertise
  [0, 24], // 7 about / craft
  [0, 20], // 8 contact
];

/** Overlay copy side on large screens — physical screen side (not RTL flex start). */
const COPY_SIDE: Array<"left" | "right" | "center"> = [
  "left", // 0 hero
  "right", // 1 phd
  "center", // 2 manifesto
  "right", // 3 stack
  "left", // 4 system design
  "right", // 5 process
  "right", // 6 expertise (RTL packs this to the physical right)
  "center", // 7 craft
  "center", // 8 contact
];

/**
 * World X for the morph (camera looks down −Z; +X = screen right).
 * Text on the physical RIGHT → morph on the LEFT (−X), and vice versa.
 */
function morphOffsetX(side: "left" | "right" | "center", halfW: number, push: number) {
  if (side === "center") return 0;
  const amount = halfW * push;
  return side === "right" ? -amount : amount;
}

/** Desktop: larger sculptures that still fit in the free half. */
function stationMorphScale(narrow: boolean, side: "left" | "right" | "center") {
  if (narrow) return 0.68;
  if (side === "center") return 0.95;
  return 0.9;
}

/** Physical screen side of the copy — accounts for html[dir=rtl] flex flipping. */
function detectSectionCopySide(sec: HTMLElement): "left" | "right" | "center" {
  if (
    sec.classList.contains("neb-statement") ||
    sec.classList.contains("neb-team") ||
    sec.classList.contains("neb-contact")
  ) {
    return "center";
  }
  const copy = sec.querySelector(
    ".neb-hero-copy, .neb-side-copy, .neb-expertise-title, .neb-cols, .neb-statement-text, .neb-team-row, .neb-email",
  ) as HTMLElement | null;
  if (!copy) return "center";
  const r = copy.getBoundingClientRect();
  const vw = window.innerWidth || 1;
  if (r.width < 8) return "center";
  const mid = r.left + r.width * 0.5;
  if (mid < vw * 0.42) return "left";
  if (mid > vw * 0.58) return "right";
  return "center";
}

const VERT = `
  uniform float uSize;
  uniform float uScale;
  uniform float uNear;
  uniform float uFar;
  attribute float aSize;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vFog;
  void main() {
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float depth = -mv.z;
    gl_PointSize = uSize * aSize * (uScale / max(0.001, depth));
    // depth fade: bright up close, dissolving into the far fog
    vFog = clamp((uFar - depth) / (uFar - uNear), 0.04, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = `
  precision highp float;
  varying vec3 vColor;
  varying float vFog;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.0, d);
    a = pow(a, 1.5);
    gl_FragColor = vec4(vColor, a * vFog);
  }
`;

function smoother(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Hash → particle-station index (matches the overlays). */
const STATION_BY_HASH: Record<string, number> = {
  expertise: 6,
};

function scrollToStation(index: number, behavior: ScrollBehavior = "smooth") {
  const root = document.querySelector(".neb-root") as HTMLElement | null;
  if (!root) return;
  const span = root.offsetHeight - window.innerHeight;
  if (span <= 0) return;
  const top = clamp01(index / (STOPS - 1)) * span;
  window.scrollTo({ top, behavior });
}

function goToHashStation(hash: string, behavior: ScrollBehavior = "smooth") {
  const key = hash.replace(/^#/, "").toLowerCase();
  const station = STATION_BY_HASH[key];
  if (station == null) return false;
  scrollToStation(station, behavior);
  return true;
}

/* ── particle-sculpture toolkit ─────────────────────────────────────────────
   Each morph target is hand-built as a particle cloud (not a sampled mesh) so
   density can be concentrated along silhouette edges / structure lines and
   thinned in interior voids, and so colour can describe each form locally:
     white = highlights / bright structure · gold = body mass · blue = accents
   Builders fill a UNIT position array (radius ≈ 1, posed) + a colour array. */
const P_WHITE: [number, number, number] = [0.72, 1.0, 0.9]; // soft mint highlight
const P_PGOLD: [number, number, number] = [0.35, 0.98, 0.75]; // bright mint
const P_GOLD: [number, number, number] = [0.129, 0.945, 0.659]; // #21f1a8
const P_BLUE: [number, number, number] = [0.0, 0.278, 0.255]; // #004741
const P_DIM: [number, number, number] = [0.12, 0.2, 0.19]; // muted teal-charcoal
const TAU = Math.PI * 2;
const rnd = () => Math.random();

function col(C: Float32Array, i: number, c: [number, number, number], k = 1) {
  C[i * 3] = Math.min(1.35, c[0] * k);
  C[i * 3 + 1] = Math.min(1.35, c[1] * k);
  C[i * 3 + 2] = Math.min(1.35, c[2] * k);
}

// random unit-sphere direction into out
function dirOnSphere(out: [number, number, number]) {
  const a = rnd() * TAU;
  const z = rnd() * 2 - 1;
  const r = Math.sqrt(Math.max(0, 1 - z * z));
  out[0] = Math.cos(a) * r;
  out[1] = z;
  out[2] = Math.sin(a) * r;
}

type Emit = (P: Float32Array, C: Float32Array, i: number, u: number) => void;
// distribute n particles across weighted parts (higher weight → denser part)
function assemble(n: number, P: Float32Array, C: Float32Array, parts: { w: number; emit: Emit }[]) {
  const total = parts.reduce((s, p) => s + p.w, 0);
  let i = 0;
  for (let k = 0; k < parts.length; k++) {
    const cnt = k === parts.length - 1 ? n - i : Math.round((parts[k].w / total) * n);
    for (let j = 0; j < cnt && i < n; j++, i++) parts[k].emit(P, C, i, cnt > 1 ? j / (cnt - 1) : 0);
  }
  while (i < n) {
    parts[parts.length - 1].emit(P, C, i, rnd());
    i++;
  }
}

// center → rotate (euler XYZ) → normalise to unit radius: bakes a shape's pose
function poseNormalize(n: number, P: Float32Array, rx: number, ry: number, rz: number) {
  let mx = 0, my = 0, mz = 0;
  for (let i = 0; i < n; i++) { mx += P[i * 3]; my += P[i * 3 + 1]; mz += P[i * 3 + 2]; }
  mx /= n; my /= n; mz /= n;
  const cx = Math.cos(rx), sx = Math.sin(rx);
  const cy = Math.cos(ry), sy = Math.sin(ry);
  const cz = Math.cos(rz), sz = Math.sin(rz);
  let maxR = 1e-6;
  for (let i = 0; i < n; i++) {
    let x = P[i * 3] - mx, y = P[i * 3 + 1] - my, z = P[i * 3 + 2] - mz;
    const y1 = y * cx - z * sx, z1 = y * sx + z * cx; y = y1; z = z1;
    const x1 = x * cy + z * sy, z2 = -x * sy + z * cy; x = x1; z = z2;
    const x2 = x * cz - y * sz, y2 = x * sz + y * cz; x = x2; y = y2;
    P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z;
    const d = x * x + y * y + z * z;
    if (d > maxR) maxR = d;
  }
  const inv = 1 / Math.sqrt(maxR);
  for (let i = 0; i < n; i++) { P[i * 3] *= inv; P[i * 3 + 1] *= inv; P[i * 3 + 2] *= inv; }
}

// SHAPE 1 — heroObject: phone + laptop wireframes (edge-dense, tech silhouette).
function edgePoint(
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number,
  t: number, jitter = 0.008,
): [number, number, number] {
  return [
    ax + (bx - ax) * t + (rnd() - 0.5) * jitter,
    ay + (by - ay) * t + (rnd() - 0.5) * jitter,
    az + (bz - az) * t + (rnd() - 0.5) * jitter,
  ];
}

function buildHero(n: number, P: Float32Array, C: Float32Array) {
  // Laptop local coords: base on XZ, screen hinged along -Z, open ~105°
  const baseW = 1.15, baseD = 0.78, baseY = 0.0;
  const scrH = 0.72, scrT = 0.03;
  const screenAng = -1.05; // radians from horizontal
  const cosA = Math.cos(screenAng), sinA = Math.sin(screenAng);

  function screenLocal(lx: number, ly: number, lz: number): [number, number, number] {
    // hinge at z = -baseD/2, y = baseY; rotate around X
    const z0 = lz;
    const y0 = ly;
    const y = baseY + y0 * cosA - z0 * sinA;
    const z = -baseD * 0.5 + y0 * sinA + z0 * cosA;
    return [lx, y, z];
  }

  // Phone sits to the right-front of the laptop
  const phW = 0.28, phH = 0.58, phD = 0.04;
  const phX = 0.72, phY = 0.02, phZ = 0.18;

  assemble(n, P, C, [
    // ── laptop base outer frame (4 edges + depth corners)
    { w: 16, emit: (P, C, i) => {
        const edges: [number, number, number, number, number, number][] = [
          [-baseW / 2, baseY, -baseD / 2, baseW / 2, baseY, -baseD / 2],
          [-baseW / 2, baseY, baseD / 2, baseW / 2, baseY, baseD / 2],
          [-baseW / 2, baseY, -baseD / 2, -baseW / 2, baseY, baseD / 2],
          [baseW / 2, baseY, -baseD / 2, baseW / 2, baseY, baseD / 2],
        ];
        const e = edges[Math.floor(rnd() * edges.length)];
        const [x, y, z] = edgePoint(e[0], e[1], e[2], e[3], e[4], e[5], rnd());
        P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z;
        col(C, i, rnd() < 0.2 ? P_WHITE : P_GOLD, 0.9 + rnd() * 0.25);
      } },
    // keyboard grid (wireframe keys)
    { w: 14, emit: (P, C, i) => {
        const cols = 14, rows = 5;
        const cx = Math.floor(rnd() * cols);
        const cy = Math.floor(rnd() * rows);
        const u = (cx + 0.5) / cols;
        const v = (cy + 0.5) / rows;
        const along = rnd() < 0.5;
        let x: number, z: number;
        if (along) {
          x = -baseW * 0.42 + baseW * 0.84 * u + (rnd() - 0.5) * 0.02;
          z = -baseD * 0.28 + baseD * 0.55 * (cy / (rows - 1));
        } else {
          x = -baseW * 0.42 + baseW * 0.84 * (cx / (cols - 1));
          z = -baseD * 0.28 + baseD * 0.55 * v + (rnd() - 0.5) * 0.02;
        }
        P[i * 3] = x; P[i * 3 + 1] = baseY + 0.01; P[i * 3 + 2] = z;
        col(C, i, rnd() < 0.15 ? P_WHITE : P_DIM, 0.75 + rnd() * 0.3);
      } },
    // trackpad rectangle
    { w: 5, emit: (P, C, i) => {
        const edges: [number, number, number, number, number, number][] = [
          [-0.18, baseY + 0.012, 0.22, 0.18, baseY + 0.012, 0.22],
          [-0.18, baseY + 0.012, 0.38, 0.18, baseY + 0.012, 0.38],
          [-0.18, baseY + 0.012, 0.22, -0.18, baseY + 0.012, 0.38],
          [0.18, baseY + 0.012, 0.22, 0.18, baseY + 0.012, 0.38],
        ];
        const e = edges[Math.floor(rnd() * edges.length)];
        const [x, y, z] = edgePoint(e[0], e[1], e[2], e[3], e[4], e[5], rnd(), 0.006);
        P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z;
        col(C, i, P_GOLD, 0.85 + rnd() * 0.2);
      } },
    // ── laptop screen outer frame
    { w: 18, emit: (P, C, i) => {
        const hw = baseW * 0.48, hh = scrH;
        const edges: [number, number, number, number, number, number][] = [
          [-hw, 0, 0, hw, 0, 0],
          [-hw, hh, 0, hw, hh, 0],
          [-hw, 0, 0, -hw, hh, 0],
          [hw, 0, 0, hw, hh, 0],
        ];
        const e = edges[Math.floor(rnd() * edges.length)];
        const t = rnd();
        const lx = e[0] + (e[3] - e[0]) * t;
        const ly = e[1] + (e[4] - e[1]) * t;
        const [x, y, z] = screenLocal(lx, ly, scrT * 0.5);
        P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z;
        col(C, i, rnd() < 0.25 ? P_WHITE : P_GOLD, 0.95 + rnd() * 0.25);
      } },
    // screen inner bezel + UI wireframe lines
    { w: 16, emit: (P, C, i) => {
        const kind = rnd();
        let lx: number, ly: number;
        if (kind < 0.35) {
          // horizontal UI rules
          const row = Math.floor(rnd() * 6);
          ly = 0.1 + (row / 5) * (scrH - 0.18);
          lx = -baseW * 0.38 + rnd() * baseW * 0.76;
        } else if (kind < 0.55) {
          // vertical sidebar
          lx = -baseW * 0.38;
          ly = 0.08 + rnd() * (scrH - 0.16);
        } else if (kind < 0.75) {
          // content card rect outline fragment
          const cx = -0.05 + (rnd() - 0.5) * 0.5;
          const cy = 0.25 + (rnd() - 0.5) * 0.35;
          if (rnd() < 0.5) { lx = cx + (rnd() - 0.5) * 0.35; ly = cy + (rnd() < 0.5 ? -0.12 : 0.12); }
          else { lx = cx + (rnd() < 0.5 ? -0.18 : 0.18); ly = cy + (rnd() - 0.5) * 0.24; }
        } else {
          // sparse screen fill (glow)
          lx = -baseW * 0.36 + rnd() * baseW * 0.72;
          ly = 0.08 + rnd() * (scrH - 0.16);
        }
        const [x, y, z] = screenLocal(lx, ly, -0.01);
        P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z;
        col(C, i, kind > 0.75 ? P_BLUE : rnd() < 0.3 ? P_WHITE : P_GOLD, 0.7 + rnd() * 0.4);
      } },
    // hinge line
    { w: 4, emit: (P, C, i) => {
        const x = -baseW * 0.45 + rnd() * baseW * 0.9;
        const [sx, sy, sz] = screenLocal(x, 0, 0);
        P[i * 3] = sx; P[i * 3 + 1] = sy; P[i * 3 + 2] = sz;
        col(C, i, P_WHITE, 1.0 + rnd() * 0.2);
      } },

    // ── phone outer frame
    { w: 12, emit: (P, C, i) => {
        const edges: [number, number, number, number, number, number][] = [
          [-phW / 2, -phH / 2, phD / 2, phW / 2, -phH / 2, phD / 2],
          [-phW / 2, phH / 2, phD / 2, phW / 2, phH / 2, phD / 2],
          [-phW / 2, -phH / 2, phD / 2, -phW / 2, phH / 2, phD / 2],
          [phW / 2, -phH / 2, phD / 2, phW / 2, phH / 2, phD / 2],
          // back corners for thickness read
          [-phW / 2, -phH / 2, -phD / 2, -phW / 2, phH / 2, -phD / 2],
          [phW / 2, -phH / 2, -phD / 2, phW / 2, phH / 2, -phD / 2],
        ];
        const e = edges[Math.floor(rnd() * edges.length)];
        const [x, y, z] = edgePoint(e[0], e[1], e[2], e[3], e[4], e[5], rnd(), 0.006);
        P[i * 3] = phX + x; P[i * 3 + 1] = phY + y; P[i * 3 + 2] = phZ + z;
        col(C, i, rnd() < 0.22 ? P_WHITE : P_GOLD, 0.95 + rnd() * 0.25);
      } },
    // phone screen inset + UI lines
    { w: 10, emit: (P, C, i) => {
        const kind = rnd();
        let x: number, y: number;
        if (kind < 0.4) {
          // screen border
          const edges: [number, number, number, number][] = [
            [-phW * 0.38, -phH * 0.42, phW * 0.38, -phH * 0.42],
            [-phW * 0.38, phH * 0.4, phW * 0.38, phH * 0.4],
            [-phW * 0.38, -phH * 0.42, -phW * 0.38, phH * 0.4],
            [phW * 0.38, -phH * 0.42, phW * 0.38, phH * 0.4],
          ];
          const e = edges[Math.floor(rnd() * edges.length)];
          const t = rnd();
          x = e[0] + (e[2] - e[0]) * t;
          y = e[1] + (e[3] - e[1]) * t;
        } else if (kind < 0.7) {
          // app row lines
          y = -phH * 0.25 + Math.floor(rnd() * 5) * 0.1;
          x = -phW * 0.3 + rnd() * phW * 0.6;
        } else {
          x = -phW * 0.28 + rnd() * phW * 0.56;
          y = -phH * 0.35 + rnd() * phH * 0.7;
        }
        P[i * 3] = phX + x;
        P[i * 3 + 1] = phY + y;
        P[i * 3 + 2] = phZ + phD * 0.45;
        col(C, i, kind > 0.7 ? P_BLUE : rnd() < 0.3 ? P_WHITE : P_GOLD, 0.8 + rnd() * 0.35);
      } },
    // phone notch / speaker
    { w: 3, emit: (P, C, i) => {
        const x = -0.06 + rnd() * 0.12;
        P[i * 3] = phX + x;
        P[i * 3 + 1] = phY + phH * 0.42;
        P[i * 3 + 2] = phZ + phD * 0.5;
        col(C, i, P_WHITE, 1.05);
      } },
    // faint connecting “signal” dust between devices
    { w: 6, emit: (P, C, i) => {
        const t = rnd();
        P[i * 3] = 0.35 + t * 0.35 + (rnd() - 0.5) * 0.08;
        P[i * 3 + 1] = 0.15 + Math.sin(t * Math.PI) * 0.2 + (rnd() - 0.5) * 0.05;
        P[i * 3 + 2] = 0.05 + t * 0.12 + (rnd() - 0.5) * 0.06;
        col(C, i, rnd() < 0.5 ? P_GOLD : P_BLUE, 0.45 + rnd() * 0.35);
      } },
  ]);
  poseNormalize(n, P, 0.18, -0.55, 0.08); // 3/4 view, screens readable
}

// SHAPE — PhD: stacked books + floating research papers
function buildPhdBooks(n: number, P: Float32Array, C: Float32Array) {
  // bookshelf stack positions (leaned slightly)
  const books: { x: number; y: number; z: number; w: number; h: number; d: number; yaw: number }[] = [
    { x: -0.22, y: -0.55, z: 0.05, w: 0.72, h: 0.12, d: 0.48, yaw: -0.08 },
    { x: -0.18, y: -0.4, z: 0.02, w: 0.68, h: 0.11, d: 0.46, yaw: 0.05 },
    { x: -0.2, y: -0.26, z: 0.0, w: 0.74, h: 0.13, d: 0.5, yaw: -0.04 },
    { x: 0.42, y: -0.48, z: 0.08, w: 0.22, h: 0.55, d: 0.4, yaw: 0.35 }, // standing book
  ];

  function bookLocal(
    B: typeof books[0],
    lx: number, ly: number, lz: number,
  ): [number, number, number] {
    const c = Math.cos(B.yaw), s = Math.sin(B.yaw);
    const rx = lx * c - lz * s;
    const rz = lx * s + lz * c;
    return [B.x + rx, B.y + ly, B.z + rz];
  }

  assemble(n, P, C, [
    // book wireframe boxes
    { w: 28, emit: (P, C, i) => {
        const B = books[Math.floor(rnd() * books.length)];
        const hw = B.w * 0.5, hh = B.h * 0.5, hd = B.d * 0.5;
        const edges: [number, number, number, number, number, number][] = [
          [-hw, -hh, -hd, hw, -hh, -hd], [-hw, -hh, hd, hw, -hh, hd],
          [-hw, hh, -hd, hw, hh, -hd], [-hw, hh, hd, hw, hh, hd],
          [-hw, -hh, -hd, -hw, -hh, hd], [hw, -hh, -hd, hw, -hh, hd],
          [-hw, hh, -hd, -hw, hh, hd], [hw, hh, -hd, hw, hh, hd],
          [-hw, -hh, -hd, -hw, hh, -hd], [hw, -hh, -hd, hw, hh, -hd],
          [-hw, -hh, hd, -hw, hh, hd], [hw, -hh, hd, hw, hh, hd],
        ];
        const e = edges[Math.floor(rnd() * edges.length)];
        const t = rnd();
        const [x, y, z] = bookLocal(
          B,
          e[0] + (e[3] - e[0]) * t,
          e[1] + (e[4] - e[1]) * t,
          e[2] + (e[5] - e[2]) * t,
        );
        P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z;
        col(C, i, rnd() < 0.3 ? P_WHITE : P_GOLD, 0.9 + rnd() * 0.25);
      } },
    // spine accents
    { w: 8, emit: (P, C, i) => {
        const B = books[Math.floor(rnd() * 3)];
        const t = rnd();
        const [x, y, z] = bookLocal(B, -B.w * 0.48, (t - 0.5) * B.h, (rnd() - 0.5) * B.d * 0.7);
        P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z;
        col(C, i, P_BLUE, 0.85 + rnd() * 0.25);
      } },
    // open book pages (flat sheets rising from the stack)
    { w: 14, emit: (P, C, i) => {
        const side = rnd() < 0.5 ? -1 : 1;
        const u = rnd(), v = rnd();
        P[i * 3] = side * (0.05 + u * 0.38);
        P[i * 3 + 1] = -0.12 + v * 0.02 + Math.abs(u - 0.5) * 0.04;
        P[i * 3 + 2] = -0.05 + (rnd() - 0.5) * 0.02;
        // page edge brighter
        const edge = u < 0.06 || u > 0.94 || v < 0.06 || v > 0.94;
        col(C, i, edge ? P_WHITE : P_DIM, edge ? 1.0 : 0.55 + rnd() * 0.25);
      } },
    // ruled text lines on open pages
    { w: 10, emit: (P, C, i) => {
        const side = rnd() < 0.5 ? -1 : 1;
        const line = Math.floor(rnd() * 7);
        const u = 0.08 + rnd() * 0.72;
        P[i * 3] = side * (0.08 + u * 0.32);
        P[i * 3 + 1] = -0.1 + line * 0.018;
        P[i * 3 + 2] = -0.04;
        col(C, i, rnd() < 0.25 ? P_GOLD : P_BLUE, 0.7 + rnd() * 0.3);
      } },
    // floating research papers
    { w: 22, emit: (P, C, i) => {
        const sheet = Math.floor(rnd() * 5);
        const ox = ((sheet % 3) - 1) * 0.55;
        const oy = 0.25 + Math.floor(sheet / 3) * 0.38 + (rnd() - 0.5) * 0.04;
        const oz = -0.15 + (sheet % 2) * 0.2;
        const yaw = (sheet - 2) * 0.18;
        const u = (rnd() - 0.5) * 0.55;
        const v = (rnd() - 0.5) * 0.72;
        const c = Math.cos(yaw), s = Math.sin(yaw);
        // mostly fill + edge denser
        const onEdge = Math.abs(u) > 0.24 || Math.abs(v) > 0.32 || rnd() < 0.2;
        if (!onEdge && rnd() < 0.55) {
          // ruled research lines
          const line = Math.floor(rnd() * 8);
          const uu = (rnd() - 0.5) * 0.42;
          const vv = -0.28 + line * 0.08;
          P[i * 3] = ox + uu * c;
          P[i * 3 + 1] = oy + vv;
          P[i * 3 + 2] = oz - uu * s;
          col(C, i, rnd() < 0.35 ? P_GOLD : P_BLUE, 0.65 + rnd() * 0.3);
          return;
        }
        P[i * 3] = ox + u * c;
        P[i * 3 + 1] = oy + v;
        P[i * 3 + 2] = oz - u * s;
        col(C, i, onEdge ? (rnd() < 0.4 ? P_WHITE : P_GOLD) : P_DIM, onEdge ? 0.95 : 0.45 + rnd() * 0.25);
      } },
    // diploma / seal ring accent
    { w: 8, emit: (P, C, i) => {
        const th = rnd() * TAU;
        const r = 0.12 + (rnd() < 0.2 ? 0 : (rnd() - 0.5) * 0.02);
        P[i * 3] = 0.55 + Math.cos(th) * r;
        P[i * 3 + 1] = 0.55 + Math.sin(th) * r * 0.85;
        P[i * 3 + 2] = 0.2;
        col(C, i, rnd() < 0.45 ? P_WHITE : P_PGOLD, 1.05 + rnd() * 0.2);
      } },
    // soft desk / shelf plane
    { w: 6, emit: (P, C, i) => {
        P[i * 3] = (rnd() - 0.5) * 1.4;
        P[i * 3 + 1] = -0.68 + (rnd() - 0.5) * 0.02;
        P[i * 3 + 2] = (rnd() - 0.5) * 0.7;
        col(C, i, P_DIM, 0.35 + rnd() * 0.25);
      } },
    // floating dust / knowledge particles
    { w: 4, emit: (P, C, i) => {
        P[i * 3] = (rnd() - 0.5) * 1.5;
        P[i * 3 + 1] = -0.2 + rnd() * 1.1;
        P[i * 3 + 2] = (rnd() - 0.5) * 0.8;
        col(C, i, rnd() < 0.5 ? P_GOLD : P_WHITE, 0.4 + rnd() * 0.4);
      } },
  ]);
  poseNormalize(n, P, 0.15, -0.25, 0.06);
}

// SHAPE 2 — full-stack layers: UI · API · Data slabs
function buildStack(n: number, P: Float32Array, C: Float32Array) {
  const layers = [
    { y: 0.55, w: 1.05, d: 0.7, c: P_GOLD as [number, number, number] },
    { y: 0.05, w: 0.92, d: 0.62, c: P_WHITE as [number, number, number] },
    { y: -0.45, w: 0.8, d: 0.55, c: P_BLUE as [number, number, number] },
  ];
  assemble(n, P, C, [
    { w: 36, emit: (P, C, i) => {
        const L = layers[Math.floor(rnd() * layers.length)];
        const hw = L.w / 2, hd = L.d / 2, y = L.y;
        const edges: [number, number, number, number, number, number][] = [
          [-hw, y, -hd, hw, y, -hd], [-hw, y, hd, hw, y, hd],
          [-hw, y, -hd, -hw, y, hd], [hw, y, -hd, hw, y, hd],
          [-hw, y + 0.08, -hd, hw, y + 0.08, -hd], [-hw, y + 0.08, hd, hw, y + 0.08, hd],
          [-hw, y, -hd, -hw, y + 0.08, -hd], [hw, y, hd, hw, y + 0.08, hd],
        ];
        const e = edges[Math.floor(rnd() * edges.length)];
        const t = rnd();
        P[i * 3] = e[0] + (e[3] - e[0]) * t + (rnd() - 0.5) * 0.01;
        P[i * 3 + 1] = e[1] + (e[4] - e[1]) * t + (rnd() - 0.5) * 0.01;
        P[i * 3 + 2] = e[2] + (e[5] - e[2]) * t + (rnd() - 0.5) * 0.01;
        col(C, i, rnd() < 0.2 ? P_WHITE : L.c, 0.9 + rnd() * 0.25);
      } },
    { w: 28, emit: (P, C, i) => {
        const L = layers[Math.floor(rnd() * layers.length)];
        P[i * 3] = (rnd() - 0.5) * L.w * 0.9;
        P[i * 3 + 1] = L.y + 0.04 + (rnd() - 0.5) * 0.02;
        P[i * 3 + 2] = (rnd() - 0.5) * L.d * 0.9;
        col(C, i, rnd() < 0.15 ? P_WHITE : L.c, 0.55 + rnd() * 0.4);
      } },
    { w: 12, emit: (P, C, i) => {
        const x = (rnd() < 0.5 ? -1 : 1) * (0.25 + rnd() * 0.2);
        const z = (rnd() < 0.5 ? -1 : 1) * (0.15 + rnd() * 0.15);
        const t = rnd();
        P[i * 3] = x; P[i * 3 + 1] = -0.4 + t * 1.0; P[i * 3 + 2] = z;
        col(C, i, P_GOLD, 0.7 + rnd() * 0.3);
      } },
    { w: 8, emit: (P, C, i) => {
        P[i * 3] = (rnd() - 0.5) * 0.3;
        P[i * 3 + 1] = (rnd() - 0.5) * 0.7;
        P[i * 3 + 2] = (rnd() - 0.5) * 0.25;
        col(C, i, P_DIM, 0.45 + rnd() * 0.3);
      } },
  ]);
  poseNormalize(n, P, 0.25, -0.4, 0.1);
}

// SHAPE — system design: layered boxes + vertical flow arrows
function buildSystemDesign(n: number, P: Float32Array, C: Float32Array) {
  // four architecture slabs (UI → API → domain → data), top → bottom
  const layers: { y: number; w: number; d: number; h: number }[] = [
    { y: 0.72, w: 0.95, d: 0.42, h: 0.1 },
    { y: 0.28, w: 1.05, d: 0.48, h: 0.1 },
    { y: -0.16, w: 1.15, d: 0.52, h: 0.1 },
    { y: -0.6, w: 1.25, d: 0.56, h: 0.12 },
  ];

  function boxEdge(
    L: { y: number; w: number; d: number; h: number },
  ): [number, number, number] {
    // pick a wireframe edge of the box
    const hw = L.w * 0.5, hd = L.d * 0.5, hh = L.h * 0.5;
    const edges: [number, number, number, number, number, number][] = [
      // top face
      [-hw, L.y + hh, -hd, hw, L.y + hh, -hd],
      [-hw, L.y + hh, hd, hw, L.y + hh, hd],
      [-hw, L.y + hh, -hd, -hw, L.y + hh, hd],
      [hw, L.y + hh, -hd, hw, L.y + hh, hd],
      // bottom face
      [-hw, L.y - hh, -hd, hw, L.y - hh, -hd],
      [-hw, L.y - hh, hd, hw, L.y - hh, hd],
      [-hw, L.y - hh, -hd, -hw, L.y - hh, hd],
      [hw, L.y - hh, -hd, hw, L.y - hh, hd],
      // verticals
      [-hw, L.y - hh, -hd, -hw, L.y + hh, -hd],
      [hw, L.y - hh, -hd, hw, L.y + hh, -hd],
      [-hw, L.y - hh, hd, -hw, L.y + hh, hd],
      [hw, L.y - hh, hd, hw, L.y + hh, hd],
    ];
    const e = edges[Math.floor(rnd() * edges.length)];
    const t = rnd();
    return [
      e[0] + (e[3] - e[0]) * t,
      e[1] + (e[4] - e[1]) * t,
      e[2] + (e[5] - e[2]) * t,
    ];
  }

  assemble(n, P, C, [
    // layer wireframes
    { w: 36, emit: (P, C, i) => {
        const li = Math.floor(rnd() * layers.length);
        const [x, y, z] = boxEdge(layers[li]);
        P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z;
        const accent = li === 0 || li === 3;
        col(C, i, accent
          ? (rnd() < 0.35 ? P_WHITE : P_GOLD)
          : (rnd() < 0.25 ? P_WHITE : P_BLUE), 0.85 + rnd() * 0.3);
      } },
    // soft top-face fills (readable slabs)
    { w: 16, emit: (P, C, i) => {
        const L = layers[Math.floor(rnd() * layers.length)];
        P[i * 3] = (rnd() - 0.5) * L.w * 0.88;
        P[i * 3 + 1] = L.y + L.h * 0.45 + (rnd() - 0.5) * 0.02;
        P[i * 3 + 2] = (rnd() - 0.5) * L.d * 0.88;
        col(C, i, rnd() < 0.2 ? P_GOLD : P_DIM, 0.45 + rnd() * 0.35);
      } },
    // vertical flow connectors between layers (center + side channels)
    { w: 18, emit: (P, C, i) => {
        const gap = Math.floor(rnd() * 3); // between L0-L1, L1-L2, L2-L3
        const a = layers[gap];
        const b = layers[gap + 1];
        const y0 = a.y - a.h * 0.55;
        const y1 = b.y + b.h * 0.55;
        const t = rnd();
        const lane = (Math.floor(rnd() * 3) - 1) * 0.28; // -0.28, 0, 0.28
        P[i * 3] = lane + (rnd() - 0.5) * 0.04;
        P[i * 3 + 1] = y0 + (y1 - y0) * t;
        P[i * 3 + 2] = (rnd() - 0.5) * 0.06;
        col(C, i, rnd() < 0.4 ? P_WHITE : P_GOLD, 0.75 + rnd() * 0.4);
      } },
    // arrowheads pointing downward on each connector
    { w: 8, emit: (P, C, i) => {
        const gap = Math.floor(rnd() * 3);
        const b = layers[gap + 1];
        const yTip = b.y + b.h * 0.55 + 0.02;
        const lane = (Math.floor(rnd() * 3) - 1) * 0.28;
        const wing = rnd() < 0.5 ? -1 : 1;
        const u = rnd();
        P[i * 3] = lane + wing * u * 0.1;
        P[i * 3 + 1] = yTip + u * 0.08;
        P[i * 3 + 2] = (rnd() - 0.5) * 0.03;
        col(C, i, P_WHITE, 1.05 + rnd() * 0.2);
      } },
    // data store cylinders under the bottom layer
    { w: 10, emit: (P, C, i) => {
        const side = rnd() < 0.5 ? -1 : 1;
        const th = rnd() * TAU;
        const rr = 0.12 + rnd() * 0.02;
        const y = -0.88 + rnd() * 0.14;
        P[i * 3] = side * 0.38 + Math.cos(th) * rr;
        P[i * 3 + 1] = y;
        P[i * 3 + 2] = Math.sin(th) * rr * 0.55;
        col(C, i, rnd() < 0.3 ? P_WHITE : P_BLUE, 0.8 + rnd() * 0.3);
      } },
    // request path spark traveling down the stack
    { w: 8, emit: (P, C, i) => {
        const t = Math.pow(rnd(), 0.7);
        P[i * 3] = (rnd() - 0.5) * 0.08;
        P[i * 3 + 1] = 0.85 - t * 1.55;
        P[i * 3 + 2] = (rnd() - 0.5) * 0.08;
        col(C, i, t > 0.7 ? P_WHITE : P_PGOLD, 0.9 + t * 0.4);
      } },
    // ambient depth dust
    { w: 4, emit: (P, C, i) => {
        P[i * 3] = (rnd() - 0.5) * 1.6;
        P[i * 3 + 1] = (rnd() - 0.5) * 1.8;
        P[i * 3 + 2] = -0.25 - rnd() * 0.35;
        col(C, i, P_DIM, 0.3 + rnd() * 0.25);
      } },
  ]);
  poseNormalize(n, P, 0.2, -0.1, 0.05);
}

// SHAPE — blueprint / construction grid (craft without letterforms)
function buildBlueprint(n: number, P: Float32Array, C: Float32Array) {
  const hw = 0.92;
  const hh = 0.68;
  const z0 = 0;

  function edge(
    ax: number, ay: number, az: number,
    bx: number, by: number, bz: number,
    t = rnd(),
  ): [number, number, number] {
    return [ax + (bx - ax) * t, ay + (by - ay) * t, az + (bz - az) * t];
  }

  assemble(n, P, C, [
    // outer sheet frame
    { w: 14, emit: (P, C, i) => {
        const edges: [number, number, number, number, number, number][] = [
          [-hw, -hh, z0, hw, -hh, z0],
          [-hw, hh, z0, hw, hh, z0],
          [-hw, -hh, z0, -hw, hh, z0],
          [hw, -hh, z0, hw, hh, z0],
        ];
        const e = edges[Math.floor(rnd() * edges.length)];
        const [x, y, z] = edge(e[0], e[1], e[2], e[3], e[4], e[5]);
        P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z + (rnd() - 0.5) * 0.01;
        col(C, i, rnd() < 0.3 ? P_WHITE : P_GOLD, 0.95 + rnd() * 0.25);
      } },
    // major construction grid (vertical + horizontal rules)
    { w: 22, emit: (P, C, i) => {
        const cols = 8, rows = 6;
        if (rnd() < 0.5) {
          const gx = -hw + ((Math.floor(rnd() * (cols + 1)) / cols) * hw * 2);
          const t = rnd();
          P[i * 3] = gx;
          P[i * 3 + 1] = -hh + t * hh * 2;
          P[i * 3 + 2] = z0 + (rnd() - 0.5) * 0.008;
        } else {
          const gy = -hh + ((Math.floor(rnd() * (rows + 1)) / rows) * hh * 2);
          const t = rnd();
          P[i * 3] = -hw + t * hw * 2;
          P[i * 3 + 1] = gy;
          P[i * 3 + 2] = z0 + (rnd() - 0.5) * 0.008;
        }
        col(C, i, rnd() < 0.18 ? P_WHITE : P_BLUE, 0.55 + rnd() * 0.35);
      } },
    // finer dashed guides (sparser, mint accent)
    { w: 12, emit: (P, C, i) => {
        const dash = Math.floor(rnd() * 24);
        if (dash % 2 === 0 && rnd() < 0.35) {
          // skip → dashed feel
          P[i * 3] = (rnd() - 0.5) * hw * 1.6;
          P[i * 3 + 1] = (rnd() - 0.5) * hh * 1.6;
          P[i * 3 + 2] = z0;
          col(C, i, P_DIM, 0.25);
          return;
        }
        if (rnd() < 0.5) {
          const gx = -hw * 0.85 + (Math.floor(rnd() * 15) / 14) * hw * 1.7;
          P[i * 3] = gx;
          P[i * 3 + 1] = (rnd() - 0.5) * hh * 1.7;
        } else {
          const gy = -hh * 0.85 + (Math.floor(rnd() * 11) / 10) * hh * 1.7;
          P[i * 3] = (rnd() - 0.5) * hw * 1.7;
          P[i * 3 + 1] = gy;
        }
        P[i * 3 + 2] = z0;
        col(C, i, P_GOLD, 0.45 + rnd() * 0.3);
      } },
    // corner registration / L-brackets
    { w: 12, emit: (P, C, i) => {
        const corners: [number, number][] = [
          [-hw, -hh], [hw, -hh], [-hw, hh], [hw, hh],
        ];
        const [cx, cy] = corners[Math.floor(rnd() * 4)];
        const len = 0.14 + rnd() * 0.1;
        const alongX = rnd() < 0.5;
        const sx = Math.sign(cx) || 1;
        const sy = Math.sign(cy) || 1;
        if (alongX) {
          P[i * 3] = cx - sx * rnd() * len;
          P[i * 3 + 1] = cy;
        } else {
          P[i * 3] = cx;
          P[i * 3 + 1] = cy - sy * rnd() * len;
        }
        P[i * 3 + 2] = z0 + 0.01;
        col(C, i, rnd() < 0.4 ? P_WHITE : P_GOLD, 1.05 + rnd() * 0.2);
      } },
    // center crosshair
    { w: 6, emit: (P, C, i) => {
        const arm = rnd() < 0.5;
        const t = (rnd() - 0.5) * 0.28;
        P[i * 3] = arm ? t : (rnd() - 0.5) * 0.03;
        P[i * 3 + 1] = arm ? (rnd() - 0.5) * 0.03 : t;
        P[i * 3 + 2] = z0 + 0.015;
        col(C, i, P_WHITE, 1.1 + rnd() * 0.2);
      } },
    // dimension ticks along bottom & side
    { w: 8, emit: (P, C, i) => {
        if (rnd() < 0.55) {
          const t = Math.floor(rnd() * 9) / 8;
          P[i * 3] = -hw * 0.9 + t * hw * 1.8;
          P[i * 3 + 1] = -hh - 0.06 - rnd() * 0.04;
          P[i * 3 + 2] = z0;
        } else {
          const t = Math.floor(rnd() * 7) / 6;
          P[i * 3] = -hw - 0.06 - rnd() * 0.04;
          P[i * 3 + 1] = -hh * 0.9 + t * hh * 1.8;
          P[i * 3 + 2] = z0;
        }
        col(C, i, P_PGOLD, 0.85 + rnd() * 0.25);
      } },
    // assembled product outline rising from the plan (phone + screen rect)
    { w: 18, emit: (P, C, i) => {
        const lift = 0.08 + rnd() * 0.22;
        const kind = rnd();
        let x: number, y: number, z: number;
        if (kind < 0.55) {
          // device outer frame
          const pw = 0.28, ph = 0.52;
          const edges: [number, number, number, number][] = [
            [-pw, -ph, pw, -ph],
            [-pw, ph, pw, ph],
            [-pw, -ph, -pw, ph],
            [pw, -ph, pw, ph],
          ];
          const e = edges[Math.floor(rnd() * 4)];
          const t = rnd();
          x = e[0] + (e[2] - e[0]) * t;
          y = e[1] + (e[3] - e[1]) * t * 0.55 + 0.05;
          z = lift;
        } else if (kind < 0.8) {
          // inner screen / content blocks
          const t = rnd();
          x = -0.18 + t * 0.36;
          y = -0.12 + Math.floor(rnd() * 4) * 0.1;
          z = lift + 0.02;
        } else {
          // diagonal construction guide on the product
          const t = rnd();
          x = -0.22 + t * 0.44;
          y = -0.2 + t * 0.4;
          z = lift + 0.01;
        }
        P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z;
        col(C, i, rnd() < 0.35 ? P_WHITE : P_GOLD, 0.9 + rnd() * 0.3);
      } },
    // soft sheet fill / paper grain
    { w: 8, emit: (P, C, i) => {
        P[i * 3] = (rnd() - 0.5) * hw * 1.85;
        P[i * 3 + 1] = (rnd() - 0.5) * hh * 1.85;
        P[i * 3 + 2] = z0 - 0.02 - rnd() * 0.03;
        col(C, i, P_DIM, 0.35 + rnd() * 0.25);
      } },
  ]);
  poseNormalize(n, P, 0.08, -0.15, 0.05);
}

// SHAPE — launch pad + rising rocket trail (let's build / ship it)
function buildLaunchPad(n: number, P: Float32Array, C: Float32Array) {
  const d: [number, number, number] = [0, 0, 0];
  assemble(n, P, C, [
    // pad outer ring
    { w: 14, emit: (P, C, i) => {
        const th = rnd() * TAU;
        const r = 0.72 + (rnd() - 0.5) * 0.04;
        P[i * 3] = Math.cos(th) * r;
        P[i * 3 + 1] = -0.85 + (rnd() - 0.5) * 0.03;
        P[i * 3 + 2] = Math.sin(th) * r;
        col(C, i, rnd() < 0.25 ? P_WHITE : P_GOLD, 0.9 + rnd() * 0.25);
      } },
    // pad inner ring
    { w: 8, emit: (P, C, i) => {
        const th = rnd() * TAU;
        const r = 0.38 + (rnd() - 0.5) * 0.03;
        P[i * 3] = Math.cos(th) * r;
        P[i * 3 + 1] = -0.82;
        P[i * 3 + 2] = Math.sin(th) * r;
        col(C, i, P_BLUE, 0.75 + rnd() * 0.3);
      } },
    // pad deck surface
    { w: 8, emit: (P, C, i) => {
        const th = rnd() * TAU;
        const r = Math.sqrt(rnd()) * 0.65;
        P[i * 3] = Math.cos(th) * r;
        P[i * 3 + 1] = -0.86 + (rnd() - 0.5) * 0.02;
        P[i * 3 + 2] = Math.sin(th) * r;
        col(C, i, P_DIM, 0.55 + rnd() * 0.3);
      } },
    // four support fins / towers around the pad
    { w: 10, emit: (P, C, i) => {
        const k = Math.floor(rnd() * 4);
        const ang = (k / 4) * TAU + Math.PI / 4;
        const t = rnd();
        P[i * 3] = Math.cos(ang) * 0.58;
        P[i * 3 + 1] = -0.85 + t * 0.55;
        P[i * 3 + 2] = Math.sin(ang) * 0.58;
        col(C, i, rnd() < 0.3 ? P_WHITE : P_GOLD, 0.8 + rnd() * 0.25);
      } },
    // dense rising trail (main rocket column)
    { w: 28, emit: (P, C, i) => {
        const t = Math.pow(rnd(), 0.7);
        const th = rnd() * TAU;
        const rad = (0.04 + (1 - t) * 0.14) * Math.sqrt(rnd());
        P[i * 3] = Math.cos(th) * rad;
        P[i * 3 + 1] = -0.75 + t * 1.7;
        P[i * 3 + 2] = Math.sin(th) * rad;
        col(C, i, t > 0.75 ? P_WHITE : rnd() < 0.4 ? P_PGOLD : P_GOLD, 0.65 + t * 0.55);
      } },
    // outer exhaust bloom near the pad
    { w: 14, emit: (P, C, i) => {
        const t = Math.pow(rnd(), 0.5);
        const th = rnd() * TAU;
        const rad = (0.1 + t * 0.45) * Math.sqrt(rnd());
        P[i * 3] = Math.cos(th) * rad;
        P[i * 3 + 1] = -0.8 + t * 0.45;
        P[i * 3 + 2] = Math.sin(th) * rad;
        col(C, i, rnd() < 0.35 ? P_BLUE : P_GOLD, 0.5 + (1 - t) * 0.5);
      } },
    // high plume / expansion at the top
    { w: 12, emit: (P, C, i) => {
        dirOnSphere(d);
        const rr = Math.pow(rnd(), 0.45) * 0.42;
        P[i * 3] = d[0] * rr;
        P[i * 3 + 1] = 0.85 + Math.abs(d[1]) * rr * 0.6 + rnd() * 0.25;
        P[i * 3 + 2] = d[2] * rr;
        col(C, i, rnd() < 0.45 ? P_WHITE : P_PGOLD, 0.85 + rnd() * 0.35);
      } },
    // spark scatter along the trail
    { w: 6, emit: (P, C, i) => {
        const t = rnd();
        const th = rnd() * TAU;
        P[i * 3] = Math.cos(th) * (0.12 + rnd() * 0.35);
        P[i * 3 + 1] = -0.5 + t * 1.5;
        P[i * 3 + 2] = Math.sin(th) * (0.12 + rnd() * 0.35);
        col(C, i, P_WHITE, 1.05 + rnd() * 0.2);
      } },
  ]);
  poseNormalize(n, P, 0.05, -0.2, 0.0);
}

// SHAPE — skill orbits (tech constellation instead of Earth globe)
function buildOrbits(n: number, P: Float32Array, C: Float32Array) {
  const d: [number, number, number] = [0, 0, 0];
  const rings = [
    { r: 0.35, tilt: 0.2 },
    { r: 0.58, tilt: -0.45 },
    { r: 0.82, tilt: 0.7 },
  ];
  assemble(n, P, C, [
    { w: 16, emit: (P, C, i) => {
        dirOnSphere(d);
        const rr = Math.pow(rnd(), 0.5) * 0.2;
        P[i * 3] = d[0] * rr; P[i * 3 + 1] = d[1] * rr; P[i * 3 + 2] = d[2] * rr;
        col(C, i, rr < 0.06 ? P_WHITE : P_GOLD, 1.0 + rnd() * 0.3);
      } },
    { w: 40, emit: (P, C, i) => {
        const ring = rings[Math.floor(rnd() * rings.length)];
        const th = rnd() * TAU;
        let x = Math.cos(th) * ring.r, y = Math.sin(th) * ring.r * 0.55, z = 0;
        const cy = Math.cos(ring.tilt), sy = Math.sin(ring.tilt);
        const y2 = y * cy - z * sy, z2 = y * sy + z * cy;
        P[i * 3] = x + (rnd() - 0.5) * 0.02;
        P[i * 3 + 1] = y2 + (rnd() - 0.5) * 0.02;
        P[i * 3 + 2] = z2 + (rnd() - 0.5) * 0.02;
        col(C, i, rnd() < 0.2 ? P_WHITE : P_GOLD, 0.75 + rnd() * 0.3);
      } },
    { w: 20, emit: (P, C, i) => {
        const ring = rings[Math.floor(rnd() * rings.length)];
        const th = (Math.floor(rnd() * 8) / 8) * TAU;
        let x = Math.cos(th) * ring.r, y = Math.sin(th) * ring.r * 0.55, z = 0;
        const cy = Math.cos(ring.tilt), sy = Math.sin(ring.tilt);
        const y2 = y * cy - z * sy, z2 = y * sy + z * cy;
        dirOnSphere(d);
        const rr = 0.08 * Math.sqrt(rnd());
        P[i * 3] = x + d[0] * rr; P[i * 3 + 1] = y2 + d[1] * rr; P[i * 3 + 2] = z2 + d[2] * rr;
        col(C, i, rnd() < 0.4 ? P_BLUE : P_GOLD, 0.95 + rnd() * 0.25);
      } },
    { w: 8, emit: (P, C, i) => {
        dirOnSphere(d);
        const rr = 0.25 + rnd() * 0.7;
        P[i * 3] = d[0] * rr; P[i * 3 + 1] = d[1] * rr; P[i * 3 + 2] = d[2] * rr;
        col(C, i, P_DIM, 0.4 + rnd() * 0.25);
      } },
  ]);
  poseNormalize(n, P, 0.4, -0.25, 0.1);
}

export default function NebulaAgency() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const { locale, dir, t } = useLocale();
  const h = t.home;

  // Hash nav (#expertise / #contact) must drive scroll-progress stations —
  // native fragment scrolling fights the fixed stage and shoves the navbar off-screen.
  useEffect(() => {
    const applyHash = (behavior: ScrollBehavior) => {
      if (!window.location.hash) return;
      // Reset any native jump first, then scroll to the correct station.
      if (goToHashStation(window.location.hash, behavior)) {
        // no-op: goToHashStation already scrolled
      }
    };

    // After layout, correct an initial #hash load (native jump may have already run).
    const t0 = window.setTimeout(() => applyHash("auto"), 0);
    const t1 = window.setTimeout(() => applyHash("auto"), 50);

    const onHashChange = () => applyHash("smooth");
    window.addEventListener("hashchange", onHashChange);

    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href) return;
      // Match "#expertise" or "/#expertise"
      const hashMatch = href.match(/#([a-z0-9_-]+)$/i);
      if (!hashMatch) return;
      const key = hashMatch[1].toLowerCase();
      if (STATION_BY_HASH[key] == null) return;
      // Only hijack when staying on (or going to) the home page
      const path = href.split("#")[0];
      if (path && path !== "/" && path !== window.location.pathname) return;
      e.preventDefault();
      history.pushState(null, "", `#${key}`);
      goToHashStation(key, "smooth");
    };
    document.addEventListener("click", onClick);

    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.removeEventListener("hashchange", onHashChange);
      document.removeEventListener("click", onClick);
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    const isCard = new URLSearchParams(window.location.search).has("card");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ── particle count: auto-reduce on small / low-power devices ──────────
    const w0 = window.innerWidth;
    const cores = navigator.hardwareConcurrency || 8;
    let count = 56000;
    if (w0 >= 1600 && cores >= 8) count = 70000;
    if (w0 < 1280) count = 44000;
    if (w0 < 900) count = 32000;
    if (w0 < 720) count = 20000;
    if (cores <= 4) count = Math.round(count * 0.62);
    if (isCard) count = Math.min(count, 22000);

    // ── renderer / scene / camera ─────────────────────────────────────────
    const canvas = document.createElement("canvas");
    canvas.className = "neb-gl";
    stage.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    let pr = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(pr);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
    camera.position.set(0, 0, CAM_Z);

    let halfH = CAM_Z * Math.tan((FOV / 2) * (Math.PI / 180));
    let halfW = halfH;

    // ── per-particle buffers ──────────────────────────────────────────────
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const stagger = new Float32Array(count);
    const noise = new Float32Array(count); // per-particle noise offset
    const swirl = new Float32Array(count * 3); // per-particle curl direction
    const disp = new Float32Array(count * 3); // cursor-repulsion displacement (eased)
    const hi = new Float32Array(count); // per-particle hover intensity (0..1, eased)
    for (let i = 0; i < count; i++) {
      stagger[i] = Math.random();
      noise[i] = Math.random();
      const a = Math.random() * Math.PI * 2;
      const b = (Math.random() - 0.5) * Math.PI;
      swirl[i * 3] = Math.cos(a) * Math.cos(b);
      swirl[i * 3 + 1] = Math.sin(b);
      swirl[i * 3 + 2] = Math.sin(a) * Math.cos(b);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uSize: { value: 0.05 },
        uScale: { value: 1000 },
        uNear: { value: 2 },
        uFar: { value: 58 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
    });
    const points = new THREE.Points(geo, material);
    scene.add(points);

    // ── build the particle sculptures: unit positions + per-station colours ─
    const heroU = new Float32Array(count * 3);
    const heroC = new Float32Array(count * 3);
    buildHero(count, heroU, heroC);
    const phdU = new Float32Array(count * 3);
    const phdC = new Float32Array(count * 3);
    buildPhdBooks(count, phdU, phdC);
    const stackU = new Float32Array(count * 3);
    const stackC = new Float32Array(count * 3);
    buildStack(count, stackU, stackC);
    const designU = new Float32Array(count * 3);
    const designC = new Float32Array(count * 3);
    buildSystemDesign(count, designU, designC);
    const orbitU = new Float32Array(count * 3);
    const orbitC = new Float32Array(count * 3);
    buildOrbits(count, orbitU, orbitC);
    const craftU = new Float32Array(count * 3);
    const craftC = new Float32Array(count * 3);
    buildBlueprint(count, craftU, craftC);
    const portalU = new Float32Array(count * 3);
    const portalC = new Float32Array(count * 3);
    buildLaunchPad(count, portalU, portalC);

    // scatter starfield colours (galaxy + process tunnel)
    const starC = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = Math.random();
      if (r < 0.5) col(starC, i, P_WHITE, 0.68 + Math.random() * 0.4);
      else if (r < 0.78) col(starC, i, P_BLUE, 0.68 + Math.random() * 0.4);
      else if (r < 0.92) col(starC, i, P_GOLD, 0.68 + Math.random() * 0.4);
      else col(starC, i, P_DIM, 0.6 + Math.random() * 0.3);
    }

    const stationColor: Float32Array[] = [heroC, phdC, starC, stackC, designC, starC, orbitC, craftC, portalC];

    // particle sizes (base; hover enlarges a copy each frame)
    for (let i = 0; i < count; i++) {
      sizes[i] = Math.random() < 0.14 ? 1.0 + Math.random() * 0.8 : 0.5 + Math.random() * 0.7;
    }
    geo.attributes.aSize.needsUpdate = true;
    const baseSizes = sizes.slice();

    // ── station base buffers + per-station offsets (rebuilt on resize) ─────
    const bases: Float32Array[] = [];
    for (let s = 0; s < STOPS; s++) bases.push(new Float32Array(count * 3));
    const offX = new Float32Array(STOPS);
    const offY = new Float32Array(STOPS);

    let TUNNEL_DEPTH = 48;
    const TUNNEL_NEAR = 9;
    let secEls: HTMLElement[] = [];
    let dotEls: HTMLElement[] = [];

    function buildStations() {
      const wPx = stage!.clientWidth || window.innerWidth;
      const narrow = wPx < 860;
      // Larger morphs need a milder push so they stay on-screen.
      const sidePush = narrow ? 0.4 : wPx >= 1400 ? 0.5 : 0.46;
      const downPush = narrow ? 0.28 : 0.1;

      const sides = COPY_SIDE.slice() as Array<"left" | "right" | "center">;
      // Always measure physical copy side (html dir=rtl flips flex-start/end).
      if (!narrow && secEls.length) {
        for (let s = 0; s < Math.min(STOPS, secEls.length); s++) {
          sides[s] = detectSectionCopySide(secEls[s]);
        }
      }

      const s0 = stationMorphScale(narrow, sides[0]);
      const s1 = stationMorphScale(narrow, sides[1]);
      const s3 = stationMorphScale(narrow, sides[3]);
      const s4 = stationMorphScale(narrow, sides[4]);
      const s5 = stationMorphScale(narrow, sides[5]);
      const s6 = stationMorphScale(narrow, sides[6]);
      const s7 = stationMorphScale(narrow, sides[7]);
      const s8 = stationMorphScale(narrow, sides[8]);

      const hr = halfH * 1.05 * s0; // devices
      const prPhd = halfH * 0.88 * s1; // phd books + papers
      const sr = halfH * 0.82 * s3; // stack
      const nr = halfH * 0.82 * s4; // system design layers
      const or = halfH * 0.9 * s6; // skill orbits
      const cr = halfH * 0.78 * s7; // blueprint grid
      const portalR = halfH * 0.72 * s8; // launch pad + trail

      for (let i = 0; i < count; i++) {
        const x = i * 3;
        bases[0][x] = heroU[x] * hr;
        bases[0][x + 1] = heroU[x + 1] * hr;
        bases[0][x + 2] = heroU[x + 2] * hr;
        bases[1][x] = phdU[x] * prPhd;
        bases[1][x + 1] = phdU[x + 1] * prPhd;
        bases[1][x + 2] = phdU[x + 2] * prPhd;
        bases[3][x] = stackU[x] * sr;
        bases[3][x + 1] = stackU[x + 1] * sr;
        bases[3][x + 2] = stackU[x + 2] * sr;
        bases[4][x] = designU[x] * nr;
        bases[4][x + 1] = designU[x + 1] * nr;
        bases[4][x + 2] = designU[x + 2] * nr;
        bases[6][x] = orbitU[x] * or;
        bases[6][x + 1] = orbitU[x + 1] * or;
        bases[6][x + 2] = orbitU[x + 2] * or;
        bases[7][x] = craftU[x] * cr;
        bases[7][x + 1] = craftU[x + 1] * cr;
        bases[7][x + 2] = craftU[x + 2] * cr;
        bases[8][x] = portalU[x] * portalR;
        bases[8][x + 1] = portalU[x + 1] * portalR;
        bases[8][x + 2] = portalU[x + 2] * portalR;
      }

      // 2 — galaxy scatter (centered / ambient)
      const g = bases[2];
      for (let i = 0; i < count; i++) {
        g[i * 3] = (Math.random() - 0.5) * halfW * (narrow ? 4.4 : 3.2);
        g[i * 3 + 1] = (Math.random() - 0.5) * halfH * 3.4;
        g[i * 3 + 2] = 9 - Math.pow(Math.random(), 0.7) * 50;
      }

      // 5 — process tunnel
      const t = bases[5];
      TUNNEL_DEPTH = 50;
      const tunnelRad = halfH * (0.16 + 0.82) * s5;
      for (let i = 0; i < count; i++) {
        const u = Math.random();
        const z = TUNNEL_NEAR - u * TUNNEL_DEPTH;
        const ang = u * Math.PI * 7 + (i % 11);
        const rad = tunnelRad * (0.2 + 0.8 * u);
        t[i * 3] = Math.cos(ang) * rad;
        t[i * 3 + 1] = Math.sin(ang) * rad * 0.82;
        t[i * 3 + 2] = z;
      }

      for (let s = 0; s < STOPS; s++) {
        offX[s] = morphOffsetX(sides[s], halfW, sidePush);
      }
      // Debug helper for layout audits (harmless in prod).
      (window as unknown as { __nebMorph?: unknown }).__nebMorph = {
        halfW,
        sidePush,
        sides: [...sides],
        offX: Array.from(offX),
      };
      offY[0] = narrow ? -halfH * 0.06 : halfH * 0.02;
      offY[1] = narrow ? -halfH * 0.04 : halfH * 0.02;
      offY[2] = 0;
      offY[3] = narrow ? -halfH * 0.04 : halfH * 0.02;
      offY[4] = narrow ? -halfH * 0.04 : halfH * 0.02;
      offY[5] = narrow ? -halfH * 0.12 : 0;
      offY[6] = narrow ? -halfH * 0.18 : halfH * 0.02;
      offY[7] = -halfH * downPush;
      offY[8] = -halfH * (narrow ? 0.22 : 0.12);
    }

    // ── live position of particle p in station s (time animation applied) ──
    const spinCos = new Float32Array(STOPS);
    const spinSin = new Float32Array(STOPS);
    let breatheAmt = 1;
    let tunnelFlow = 0;

    function getPos(s: number, p: number, out: [number, number, number]) {
      const b = bases[s];
      const x = b[p * 3];
      let y = b[p * 3 + 1];
      const z = b[p * 3 + 2];
      const c = spinCos[s];
      const sn = spinSin[s];
      let rx = x * c + z * sn;
      let rz = -x * sn + z * c;
      if (BREATHE[s]) {
        rx *= breatheAmt;
        y *= breatheAmt;
        rz *= breatheAmt;
      }
      if (s === 5) {
        rz += tunnelFlow;
        if (rz > TUNNEL_NEAR) rz -= TUNNEL_DEPTH;
      }
      out[0] = rx + offX[s];
      out[1] = y + offY[s];
      out[2] = rz;
    }

    // ── sizing ────────────────────────────────────────────────────────────
    function resize() {
      const vv = window.visualViewport;
      const w = Math.max(stage!.clientWidth || 0, vv?.width ?? 0, window.innerWidth) || window.innerWidth;
      // Prefer the larger height so canvas never underfills while mobile chrome collapses.
      const h =
        Math.max(stage!.clientHeight || 0, vv?.height ?? 0, window.innerHeight) || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      halfH = CAM_Z * Math.tan((FOV / 2) * (Math.PI / 180));
      halfW = halfH * (w / h);
      pr = Math.min(window.devicePixelRatio || 1, 1.75);
      material.uniforms.uScale.value = (h * pr) / (2 * Math.tan((FOV / 2) * (Math.PI / 180)));
      material.uniforms.uSize.value = w < 720 ? 0.075 : 0.05;
      buildStations();
    }
    resize();

    let resizePending = false;
    const scheduleResize = () => {
      if (resizePending) return;
      resizePending = true;
      requestAnimationFrame(() => {
        resizePending = false;
        resize();
      });
    };
    const ro = new ResizeObserver(scheduleResize);
    ro.observe(stage);
    window.visualViewport?.addEventListener("resize", scheduleResize);
    window.visualViewport?.addEventListener("scroll", scheduleResize);

    // ── overlay refs ──────────────────────────────────────────────────────
    secEls = Array.from(stage.querySelectorAll<HTMLElement>(".neb-sec"));
    dotEls = Array.from(stage.querySelectorAll<HTMLElement>(".neb-dot"));
    // Recompute after layout — dir=rtl affects flex packing / copy side.
    requestAnimationFrame(() => {
      buildStations();
      requestAnimationFrame(() => buildStations());
    });

    // ── mouse parallax + cursor hover field ───────────────────────────────
    const hoverEnabled = !isCard; // needs a real cursor
    let mx = 0;
    let my = 0;
    let hoverPresent = false; // cursor currently inside the window
    function onPointer(e: PointerEvent) {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = -(e.clientY / window.innerHeight - 0.5) * 2;
      hoverPresent = true;
    }
    function onLeave() {
      hoverPresent = false; // particles ease back when the cursor leaves
    }
    if (hoverEnabled) {
      window.addEventListener("pointermove", onPointer, { passive: true });
      document.addEventListener("pointerleave", onLeave);
    }
    const PARALLAX = 1.7;
    // reusable for unprojecting the cursor onto the z=0 plane each frame
    const cursorV = new THREE.Vector3();
    let cwx = 0, cwy = 0, cwz = 0, hoverActive = false;

    // ── frame writer ──────────────────────────────────────────────────────
    const A: [number, number, number] = [0, 0, 0];
    const B: [number, number, number] = [0, 0, 0];
    let camDolly = 0;

    function writeFrame(p: number, time: number) {
      for (let s = 0; s < STOPS; s++) {
        const ang = time * SPIN[s];
        spinCos[s] = Math.cos(ang);
        spinSin[s] = Math.sin(ang);
      }
      breatheAmt = 1 + 0.024 * Math.sin(time * 0.7);
      tunnelFlow = (time * 2.4) % TUNNEL_DEPTH;

      const sp = p * (STOPS - 1);
      const i = Math.min(STOPS - 2, Math.floor(sp));
      const f = sp - i;
      const morphT = smoother(clamp01((f - 0.2) / 0.6));
      const swAmt = Math.sin(morphT * Math.PI) * halfH * 0.62;
      camDolly = Math.sin(morphT * Math.PI); // 0 settled → 1 mid-transit (fly through)
      const cA = stationColor[i]; // colour describes each form; cross-faded over the morph
      const cB = stationColor[i + 1];
      // Dim dense morphs when settled so copy stays readable (galaxy/tunnel stay brighter)
      const clearA = i === 2 || i === 5 ? 1 : 0.62;
      const clearB = i + 1 === 2 || i + 1 === 5 ? 1 : 0.62;
      const particleDim = clearA + (clearB - clearA) * morphT;

      // cursor repulsion field: unproject the pointer onto the z=0 plane
      hoverActive = false;
      if (hoverEnabled && hoverPresent) {
        cursorV.set(mx, my, 0.5).unproject(camera).sub(camera.position);
        if (Math.abs(cursorV.z) > 1e-4) {
          const tt = -camera.position.z / cursorV.z;
          cwx = camera.position.x + cursorV.x * tt;
          cwy = camera.position.y + cursorV.y * tt;
          cwz = camera.position.z + cursorV.z * tt;
          hoverActive = true;
        }
      }
      const HR = halfH * 0.5; // influence radius
      const HR2 = HR * HR;
      const HPUSH = halfH * 0.36; // peak repulsion distance

      for (let q = 0; q < count; q++) {
        const d = stagger[q];
        let pt = (morphT - d * STAGGER) / (1 - STAGGER);
        pt = pt < 0 ? 0 : pt > 1 ? 1 : pt;
        pt = smoother(pt);
        getPos(i, q, A);
        getPos(i + 1, q, B);
        const nf = noise[q];
        const fs = Math.sin(time * 0.6 + nf * 6.283);
        const fc = Math.cos(time * 0.47 + nf * 6.283);
        const x3 = q * 3;
        // base morph position (with swirl + organic float)
        const bx = A[0] + (B[0] - A[0]) * pt + swirl[x3] * swAmt + fs * 0.05;
        const by = A[1] + (B[1] - A[1]) * pt + swirl[x3 + 1] * swAmt + fc * 0.05;
        const bz = A[2] + (B[2] - A[2]) * pt + swirl[x3 + 2] * swAmt + fs * fc * 0.06;
        // repulsion target (away from cursor) + hover intensity, both softly eased
        let tx = 0, ty = 0, tz = 0, th = 0;
        if (hoverActive) {
          const ddx = bx - cwx, ddy = by - cwy, ddz = bz - cwz;
          const dist2 = ddx * ddx + ddy * ddy + ddz * ddz;
          if (dist2 < HR2) {
            const dd = Math.sqrt(dist2) || 1e-3;
            const fall = 1 - dd / HR;
            th = fall * fall; // smooth falloff
            const k = (HPUSH * th) / dd;
            tx = ddx * k; ty = ddy * k; tz = ddz * k;
          }
        }
        disp[x3] += (tx - disp[x3]) * 0.16;
        disp[x3 + 1] += (ty - disp[x3 + 1]) * 0.16;
        disp[x3 + 2] += (tz - disp[x3 + 2]) * 0.16;
        hi[q] += (th - hi[q]) * 0.16;
        positions[x3] = bx + disp[x3];
        positions[x3 + 1] = by + disp[x3 + 1];
        positions[x3 + 2] = bz + disp[x3 + 2];
        // brighten with hover; dim settled dense morphs for text contrast
        const hb = (1 + hi[q] * 0.95) * particleDim;
        colors[x3] = Math.min(1.55, (cA[x3] + (cB[x3] - cA[x3]) * morphT) * hb);
        colors[x3 + 1] = Math.min(1.55, (cA[x3 + 1] + (cB[x3 + 1] - cA[x3 + 1]) * morphT) * hb);
        colors[x3 + 2] = Math.min(1.55, (cA[x3 + 2] + (cB[x3 + 2] - cA[x3 + 2]) * morphT) * hb);
        if (hoverEnabled) sizes[q] = baseSizes[q] * (1 + hi[q] * 1.4) * (0.85 + particleDim * 0.15);
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.aColor.needsUpdate = true;
      if (hoverEnabled) geo.attributes.aSize.needsUpdate = true;

      // overlay fades + directional slide (triangular falloff around station)
      for (let s = 0; s < secEls.length; s++) {
        const vis = Math.max(0, 1 - Math.abs(sp - s) / 0.6);
        const e = vis * vis;
        const dx = SLIDE[s] ? SLIDE[s][0] * (1 - vis) : 0;
        const dy = SLIDE[s] ? SLIDE[s][1] * (1 - vis) : 0;
        secEls[s].style.opacity = String(e);
        secEls[s].style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      }
      const active = Math.round(sp);
      for (let s = 0; s < dotEls.length; s++) {
        dotEls[s].style.opacity = s === active ? "1" : "0.32";
        dotEls[s].style.transform = `scale(${s === active ? 1.7 : 1})`;
      }
    }

    // ── reduced motion: hold the settled hero object ──────────────────────
    if (reduced) {
      writeFrame(0, 0);
      renderer.render(scene, camera);
      return () => {
        if (hoverEnabled) {
          window.removeEventListener("pointermove", onPointer);
          document.removeEventListener("pointerleave", onLeave);
        }
        ro.disconnect();
        window.visualViewport?.removeEventListener("resize", scheduleResize);
        window.visualViewport?.removeEventListener("scroll", scheduleResize);
        geo.dispose();
        material.dispose();
        renderer.dispose();
        canvas.remove();
      };
    }

    // ── loop (paused while the tab is hidden) ─────────────────────────────
    let raf = 0;
    let running = true;
    let pCur = 0;
    let pTarget = 0;
    const start = performance.now();

    function frame(now: number) {
      const time = (now - start) / 1000;
      if (isCard) {
        const period = 13;
        const phase = (time / period) % 2;
        pTarget = phase < 1 ? phase : 2 - phase;
      } else {
        const rect = root!.getBoundingClientRect();
        const span = root!.offsetHeight - window.innerHeight;
        pTarget = span > 0 ? clamp01(-rect.top / span) : 0;
      }
      pCur += (pTarget - pCur) * 0.07;

      writeFrame(pCur, time);

      const camZ = CAM_Z - camDolly * 5.5;
      camera.position.x += (mx * PARALLAX - camera.position.x) * 0.05;
      camera.position.y += (my * PARALLAX * 0.7 - camera.position.y) * 0.05;
      camera.position.z += (camZ - camera.position.z) * 0.06;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    function onVisibility() {
      if (document.hidden) {
        if (running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      } else if (!running) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      if (hoverEnabled) {
        window.removeEventListener("pointermove", onPointer);
        document.removeEventListener("pointerleave", onLeave);
      }
      ro.disconnect();
      window.visualViewport?.removeEventListener("resize", scheduleResize);
      window.visualViewport?.removeEventListener("scroll", scheduleResize);
      geo.dispose();
      material.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  return (
    <div ref={rootRef} className="neb-root">
      <style>{`
        .neb-root { position: relative; width: 100%; background: #171717; }
        .neb-stage {
          position: fixed; inset: 0; width: 100%; overflow: hidden; z-index: 0;
          /* lvh = chrome-hidden height so stage never short-flashes when URL bar collapses */
          height: 100%;
          height: 100lvh;
          min-height: 100%;
          min-height: 100dvh;
          min-height: -webkit-fill-available;
          background:
            radial-gradient(120% 130% at 70% 30%, #004741 0%, #1a2422 40%, #171717 100%);
          font-family: "Vazirmatn", "Sora", system-ui, sans-serif; color: #e8fff8;
        }
        .neb-gl { position: absolute; inset: 0; width: 100%; height: 100%; display: block; z-index: 0; }
        .neb-spacer { position: relative; height: 1060svh; width: 100%; pointer-events: none; z-index: 1; }

        /* section overlay shell */
        .neb-sec {
          position: absolute; inset: 0; z-index: 3; pointer-events: none;
          display: flex; padding: 0 max(1.25rem, 5vw);
          box-sizing: border-box; width: 100%; max-width: 100%;
          overflow: visible; will-change: opacity, transform;
        }
        .neb-outline {
          color: transparent;
          -webkit-text-stroke: 1.2px rgba(232,255,248,0.78);
          paint-order: stroke fill;
        }

        /* 0 — hero */
        .neb-hero { align-items: center; justify-content: flex-start; }
        .neb-hero-copy {
          max-width: min(48ch, 100%); width: 100%;
          direction: inherit; text-align: start;
          box-sizing: border-box;
          padding: 2rem 2.15rem;
          border-radius: 1.25rem;
          overflow: visible;
          background:
            linear-gradient(180deg, rgba(8,10,10,0.92) 0%, rgba(8,10,10,0.8) 100%),
            radial-gradient(130% 120% at 50% 45%, rgba(8,10,10,0.96) 0%, rgba(12,14,14,0.78) 48%, rgba(12,14,14,0.32) 72%, transparent 88%);
          text-shadow: 0 2px 20px rgba(0,0,0,0.7);
        }
        .neb-display {
          font-family: "Vazirmatn", "Sora", sans-serif; font-weight: 800; text-transform: none;
          font-size: clamp(1.85rem, 5vw, 5rem); line-height: 1.12; letter-spacing: -0.02em;
          margin: 0; overflow-wrap: anywhere; white-space: normal;
          max-width: 100%;
        }
        .neb-display-line {
          display: block;
          white-space: normal;
          overflow-wrap: anywhere;
        }
        .neb-display-line.neb-outline {
          white-space: normal;
        }
        .neb-lead {
          font-size: clamp(0.95rem, 1.3vw, 1.15rem); line-height: 1.55; color: #9fbab2;
          margin-top: 1.4rem; max-width: min(46ch, 100%); font-weight: 400;
        }

        /* 1 — statement */
        .neb-statement { align-items: center; justify-content: center; text-align: center; direction: inherit; }
        .neb-statement-text {
          font-family: "Vazirmatn", "Sora", sans-serif; font-weight: 700; text-transform: none;
          font-size: clamp(1.35rem, 3.4vw, 3rem); line-height: 1.2; letter-spacing: -0.01em;
          max-width: min(30ch, 88vw); margin: 0;
          box-sizing: border-box;
          padding: 1.45rem 1.7rem;
          border-radius: 1.25rem;
          overflow: visible;
          background:
            linear-gradient(180deg, rgba(8,10,10,0.9) 0%, rgba(8,10,10,0.74) 100%),
            radial-gradient(130% 120% at 50% 50%, rgba(8,10,10,0.94) 0%, rgba(12,14,14,0.65) 50%, rgba(12,14,14,0.22) 74%, transparent 88%);
          text-shadow: 0 2px 18px rgba(0,0,0,0.7);
        }
        .neb-name-break {
          display: block;
          flex-basis: 100%;
          width: 100%;
          height: 0;
        }
        @media (min-width: 861px) {
          .neb-hero {
            justify-content: flex-start;
            align-items: center;
          }
          .neb-hero-copy {
            width: min(40vw, 46ch);
            max-width: min(40vw, 46ch);
            margin-inline-end: auto;
            margin-inline-start: 0;
            margin-left: 0;
            margin-right: auto;
            padding: 2.1rem 2.25rem;
          }
          .neb-right {
            justify-content: flex-end;
          }
          .neb-left {
            justify-content: flex-start;
          }
          .neb-right .neb-side-copy,
          .neb-left .neb-side-copy {
            width: min(42vw, 42ch);
            max-width: min(42vw, 42ch);
            padding: 2.1rem 2.25rem;
          }
          .neb-right .neb-side-copy {
            margin-inline-start: auto;
            margin-inline-end: 0;
            margin-right: 0;
            margin-left: auto;
          }
          .neb-left .neb-side-copy {
            margin-inline-end: auto;
            margin-inline-start: 0;
            margin-left: 0;
            margin-right: auto;
          }
          .neb-expertise {
            /* Pin to physical left — html[dir=rtl] makes margin-inline pack to the right */
            inset: 0 auto 0 max(1.25rem, 5vw) !important;
            width: min(44vw, 620px) !important;
            max-width: min(44vw, 620px) !important;
            margin: 0 !important;
            align-items: stretch;
            justify-content: center;
          }
          .neb-expertise .neb-cols {
            width: 100%;
            max-width: 100%;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .neb-statement-text {
            max-width: min(32ch, 70vw);
            font-size: clamp(1.85rem, 3vw, 2.9rem);
            padding: 1.6rem 1.9rem;
          }
          .neb-team-row {
            flex-wrap: wrap;
            white-space: normal;
            gap: 0.55rem clamp(1rem, 2.4vw, 2.6rem);
            max-width: min(92vw, 980px);
            justify-content: center;
            padding: 1.25rem 1.5rem;
          }
          .neb-name {
            font-size: clamp(1.7rem, 3.6vw, 3.5rem);
          }
          .neb-display {
            font-size: clamp(2.4rem, 4.4vw, 4.6rem);
            line-height: 1.14;
          }
          .neb-side-copy { max-width: min(42ch, 42vw); }
          .neb-h2 {
            font-size: clamp(1.9rem, 3.4vw, 3.2rem);
            white-space: normal;
            overflow-wrap: anywhere;
            max-width: 100%;
            line-height: 1.2;
          }
          .neb-h2.neb-h2-wrap { white-space: normal; }
          .neb-para {
            max-width: 100%;
          }
          .neb-expertise-title {
            font-size: clamp(1.85rem, 3.2vw, 3rem);
            white-space: normal;
            overflow-wrap: anywhere;
            padding: 1.35rem 1.7rem;
            width: 100%;
            box-sizing: border-box;
          }
          .neb-team-title {
            white-space: normal;
            font-size: clamp(1.2rem, 2.2vw, 2rem);
            padding: 0.85rem 1.35rem;
          }
          .neb-email {
            white-space: normal;
            font-size: clamp(1.6rem, 3.8vw, 3.2rem);
            padding: 1.15rem 1.5rem;
          }
        }

        /* 2 / 3 — agency / solutions side blocks */
        .neb-right { align-items: center; justify-content: flex-end; }
        .neb-left { align-items: center; justify-content: flex-start; }
        .neb-side-copy {
          max-width: min(36ch, 100%); width: 100%;
          direction: inherit; text-align: start;
          box-sizing: border-box;
          padding: 1.85rem 1.9rem;
          border-radius: 1.25rem;
          overflow: visible;
          background:
            linear-gradient(180deg, rgba(8,10,10,0.92) 0%, rgba(8,10,10,0.8) 100%),
            radial-gradient(130% 120% at 50% 45%, rgba(8,10,10,0.96) 0%, rgba(12,14,14,0.78) 48%, rgba(12,14,14,0.28) 72%, transparent 88%);
          text-shadow: 0 2px 18px rgba(0,0,0,0.7);
        }
        .neb-right .neb-side-copy { text-align: start; }
        .neb-h2 {
          font-family: "Vazirmatn", "Sora", sans-serif; font-weight: 800; text-transform: none;
          font-size: clamp(1.8rem, 5vw, 3.6rem); margin: 0; letter-spacing: -0.02em; line-height: 1.15;
          overflow-wrap: anywhere; max-width: 100%;
        }
        .neb-para {
          font-size: clamp(0.95rem, 1.25vw, 1.08rem); line-height: 1.55; color: #9fbab2;
          margin-top: 1rem; font-weight: 400; max-width: 100%;
        }
        .neb-benefit-list {
          list-style: none; margin: 1.1rem 0 0; padding: 0;
        }
        .neb-benefit-list li {
          font-size: clamp(0.86rem, 1.1vw, 0.98rem); color: #b8d4cc; line-height: 1.75;
          letter-spacing: 0.01em; padding-right: 1rem; padding-left: 0; position: relative;
        }
        .neb-benefit-list li::before {
          content: ""; position: absolute; right: 0; left: auto; top: 0.7em;
          width: 5px; height: 5px; background: #21f1a8; border-radius: 50%;
        }

        /* 4 — expertise */
        .neb-expertise {
          flex-direction: column; align-items: flex-start; justify-content: center;
          box-sizing: border-box;
        }
        .neb-expertise-title {
          font-family: "Vazirmatn", "Sora", sans-serif; font-weight: 800; text-transform: none;
          font-size: clamp(1.7rem, 5vw, 3.4rem); margin: 0 0 1.25rem; letter-spacing: -0.02em;
          line-height: 1.15; max-width: 100%; overflow-wrap: anywhere;
          direction: inherit; text-align: start;
          box-sizing: border-box;
          padding: 1.15rem 1.45rem;
          border-radius: 1rem;
          background:
            linear-gradient(180deg, rgba(8,10,10,0.94) 0%, rgba(8,10,10,0.84) 100%),
            radial-gradient(140% 140% at 70% 50%, rgba(10,12,12,0.96) 0%, rgba(17,17,17,0.86) 42%, rgba(17,17,17,0.4) 68%, transparent 82%);
          text-shadow: 0 2px 20px rgba(0,0,0,0.75);
        }
        .neb-cols {
          display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: clamp(1rem, 2.4vw, 2.2rem);
          width: min(70vw, 900px); max-width: 100%;
          box-sizing: border-box;
          padding: 1.7rem 1.65rem;
          border-radius: 1.25rem;
          background:
            linear-gradient(180deg, rgba(8,10,10,0.9) 0%, rgba(8,10,10,0.75) 100%),
            radial-gradient(100% 130% at 50% 40%, rgba(10,12,12,0.92) 0%, rgba(17,17,17,0.78) 48%, rgba(17,17,17,0.3) 72%, transparent 88%);
        }
        .neb-col {
          direction: inherit; text-align: start; min-width: 0;
        }
        .neb-col h4 {
          font-family: "Vazirmatn", "Sora", sans-serif; font-weight: 700; text-transform: none;
          font-size: 0.95rem; letter-spacing: 0.04em; margin: 0 0 0.9rem; color: #fff;
        }
        .neb-col ul { list-style: none; margin: 0; padding: 0; }
        .neb-col li {
          font-size: 0.86rem; color: #8faaa3; line-height: 1.9; letter-spacing: 0.01em;
        }

        /* 5 — craft standards */
        .neb-team {
          flex-direction: column; align-items: center; justify-content: center;
          overflow: hidden; text-align: center;
        }
        .neb-team-title {
          font-family: "Vazirmatn", "Sora", sans-serif; font-weight: 800; text-transform: none;
          font-size: clamp(1.1rem, 2.8vw, 2.4rem); letter-spacing: 0.04em; margin: 0 0 1.4rem;
          color: #c5e0d8; max-width: 100%; padding: 0.65rem 1rem;
          border-radius: 1rem;
          background:
            linear-gradient(180deg, rgba(8,10,10,0.82) 0%, rgba(8,10,10,0.55) 100%),
            radial-gradient(140% 140% at 50% 50%, rgba(8,10,10,0.9) 0%, rgba(12,14,14,0.4) 65%, transparent 84%);
          text-shadow: 0 2px 18px rgba(0,0,0,0.7);
        }
        .neb-team-row {
          display: flex; flex-wrap: wrap; justify-content: center; align-items: baseline;
          gap: clamp(0.6rem, 2.2vw, 2.2rem) clamp(0.9rem, 3vw, 2.8rem);
          width: 100%; max-width: 100%;
          white-space: normal; box-sizing: border-box; padding: 0.95rem 0.8rem;
          border-radius: 1.25rem;
          background:
            linear-gradient(180deg, rgba(8,10,10,0.82) 0%, rgba(8,10,10,0.62) 100%),
            radial-gradient(100% 140% at 50% 50%, rgba(8,10,10,0.9) 0%, rgba(12,14,14,0.55) 55%, rgba(12,14,14,0.18) 78%, transparent 90%);
        }
        .neb-name {
          font-family: "Vazirmatn", "Sora", sans-serif; font-weight: 800; text-transform: none;
          font-size: clamp(1.35rem, 4.8vw, 4.4rem); line-height: 1.05; letter-spacing: -0.02em;
        }

        /* 6 — contact */
        .neb-contact { flex-direction: column; align-items: center; justify-content: center; }
        .neb-email {
          font-family: "Vazirmatn", "Sora", sans-serif; font-weight: 800; text-transform: none;
          font-size: clamp(1.4rem, 5vw, 3.8rem); letter-spacing: -0.02em; color: #fff;
          text-decoration: none; pointer-events: auto; word-break: normal; text-align: center;
          direction: inherit; max-width: min(22ch, 92vw); line-height: 1.2;
          padding: 0.9rem 1.3rem;
          border-radius: 1.25rem;
          background:
            linear-gradient(180deg, rgba(8,10,10,0.86) 0%, rgba(8,10,10,0.62) 100%),
            radial-gradient(130% 130% at 50% 50%, rgba(8,10,10,0.92) 0%, rgba(12,14,14,0.5) 58%, transparent 82%);
          text-shadow: 0 2px 20px rgba(0,0,0,0.75);
        }
        .neb-email:hover { color: #21f1a8; }
        .neb-footer {
          position: absolute; left: 0; right: 0; bottom: 6vh; padding: 0 6vw;
        }
        .neb-divider { height: 1px; background: rgba(232,255,248,0.16); margin-bottom: 1.4rem; }
        .neb-foot-links {
          display: flex; gap: 28px; flex-wrap: wrap; justify-content: center; pointer-events: auto;
        }
        .neb-foot-links a {
          font-size: 12px; letter-spacing: 0.06em; text-transform: none;
          color: #8faaa3; text-decoration: none; opacity: 0.85; transition: opacity .25s;
        }
        .neb-foot-links a:hover { opacity: 1; }

        /* progress rail */
        .neb-rail {
          position: absolute; right: 30px; top: 50%; transform: translateY(-50%);
          display: flex; flex-direction: column; gap: 13px; z-index: 6; pointer-events: none;
        }
        .neb-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #21f1a8;
          transition: opacity .4s ease, transform .4s ease; will-change: opacity, transform;
        }
        .neb-hint {
          position: absolute; bottom: 26px; left: 34px; z-index: 6; pointer-events: none;
          font-size: 11px; letter-spacing: 0.06em; text-transform: none; color: #7a968e; opacity: 0.8;
        }

        @media (max-width: 860px) {
          .neb-sec { padding: 0 max(1.1rem, 7vw); overflow: visible; }
          .neb-hero-copy {
            padding: 1.45rem 1.35rem;
            background:
              linear-gradient(180deg, rgba(8,10,10,0.92) 0%, rgba(8,10,10,0.82) 100%),
              radial-gradient(130% 130% at 50% 45%, rgba(8,10,10,0.96) 0%, rgba(12,14,14,0.82) 52%, rgba(12,14,14,0.35) 78%, transparent 92%);
            text-shadow: 0 2px 22px rgba(0,0,0,0.85);
          }
          .neb-lead { color: #b7d0c8; }
          .neb-statement-text {
            padding: 1.45rem 1.5rem;
            background:
              linear-gradient(180deg, rgba(8,10,10,0.92) 0%, rgba(8,10,10,0.82) 100%),
              radial-gradient(130% 130% at 50% 50%, rgba(8,10,10,0.96) 0%, rgba(12,14,14,0.78) 55%, rgba(12,14,14,0.3) 80%, transparent 94%);
            text-shadow: 0 2px 22px rgba(0,0,0,0.85);
          }
          .neb-side-copy {
            padding: 1.45rem 1.35rem;
            background:
              linear-gradient(180deg, rgba(8,10,10,0.92) 0%, rgba(8,10,10,0.82) 100%),
              radial-gradient(130% 130% at 50% 45%, rgba(8,10,10,0.96) 0%, rgba(12,14,14,0.82) 52%, rgba(12,14,14,0.35) 78%, transparent 92%);
            text-shadow: 0 2px 22px rgba(0,0,0,0.85);
          }
          .neb-para { color: #b7d0c8; }
          .neb-benefit-list li { color: #c5ddd4; }
          .neb-cols {
            grid-template-columns: repeat(2, minmax(0, 1fr)); width: 100%; row-gap: 1.6rem;
            padding: 1.35rem 1.25rem;
            background:
              linear-gradient(180deg, rgba(8,10,10,0.9) 0%, rgba(8,10,10,0.8) 100%),
              radial-gradient(120% 140% at 50% 40%, rgba(8,10,10,0.95) 0%, rgba(12,14,14,0.82) 55%, rgba(12,14,14,0.35) 80%, transparent 95%);
          }
          .neb-expertise-title {
            white-space: normal; font-size: clamp(1.45rem, 6.5vw, 2.2rem);
            padding: 0.95rem 1.2rem;
            background:
              linear-gradient(180deg, rgba(8,10,10,0.92) 0%, rgba(8,10,10,0.8) 100%),
              radial-gradient(140% 140% at 70% 50%, rgba(8,10,10,0.96) 0%, rgba(12,14,14,0.6) 70%, transparent 88%);
            text-shadow: 0 2px 22px rgba(0,0,0,0.85);
          }
          .neb-col li { color: #b7d0c8; }
          .neb-name { font-size: clamp(1.15rem, 7.5vw, 2.2rem); }
          .neb-h2 { white-space: normal; font-size: clamp(1.55rem, 7vw, 2.35rem); overflow-wrap: anywhere; }
          .neb-h2.neb-h2-wrap { white-space: normal; line-height: 1.12; }
          .neb-team-title {
            white-space: normal; font-size: clamp(0.95rem, 3.5vw, 1.3rem);
            padding: 0.8rem 1.15rem;
            background:
              linear-gradient(180deg, rgba(8,10,10,0.92) 0%, rgba(8,10,10,0.8) 100%),
              radial-gradient(140% 140% at 50% 50%, rgba(8,10,10,0.96) 0%, rgba(12,14,14,0.55) 70%, transparent 88%);
            text-shadow: 0 2px 20px rgba(0,0,0,0.85);
          }
          .neb-team-row {
            padding: 1.15rem 1rem;
            background:
              linear-gradient(180deg, rgba(8,10,10,0.92) 0%, rgba(8,10,10,0.82) 100%),
              radial-gradient(120% 140% at 50% 50%, rgba(8,10,10,0.95) 0%, rgba(12,14,14,0.75) 58%, rgba(12,14,14,0.28) 82%, transparent 95%);
          }
          .neb-email {
            padding: 1.15rem 1.35rem;
            background:
              linear-gradient(180deg, rgba(8,10,10,0.92) 0%, rgba(8,10,10,0.82) 100%),
              radial-gradient(130% 130% at 50% 50%, rgba(8,10,10,0.96) 0%, rgba(12,14,14,0.7) 60%, transparent 88%);
            text-shadow: 0 2px 22px rgba(0,0,0,0.85);
          }
          .neb-footer {
            padding: 0 max(1.1rem, 7vw);
            background: none;
          }
          .neb-foot-links a { color: #b7d0c8; }
          .neb-rail { right: 14px; }
          .neb-hint {
            left: 20px;
            padding: 0.35rem 0.55rem;
            border-radius: 0.5rem;
            background: rgba(8,10,10,0.72);
          }
        }
      `}</style>

      <div ref={stageRef} className="neb-stage" lang={locale} dir={dir}>
        <SiteNav />

        {/* 0 — hero */}
        <section className="neb-sec neb-hero" style={{ opacity: 0 }}>
          <div className="neb-hero-copy">
            <h1 className="neb-display">
              <span className="neb-display-line">{h.name}</span>
              <span className="neb-display-line neb-outline">{h.role}</span>
            </h1>
            <p className="neb-lead">{h.lead}</p>
          </div>
        </section>

        {/* 1 — PhD */}
        <section className="neb-sec neb-right" style={{ opacity: 0 }}>
          <div className="neb-side-copy">
            <h2 className="neb-h2 neb-h2-wrap">
              {h.phdTitle.split("\n").map((line, i) => (
                <span key={i}>
                  {i > 0 ? <br /> : null}
                  {line}
                </span>
              ))}
            </h2>
            <p className="neb-para">{h.phdBody}</p>
          </div>
        </section>

        {/* 2 — manifesto */}
        <section className="neb-sec neb-statement" style={{ opacity: 0 }}>
          <h2 className="neb-statement-text">
            {h.manifestoLine1}
            <br />
            {h.manifestoBeforeOutline}{" "}
            <span className="neb-outline">{h.manifestoOutline}</span>
            {h.manifestoAfterOutline ? ` ${h.manifestoAfterOutline}` : ""}
          </h2>
        </section>

        {/* 3 — full-stack */}
        <section className="neb-sec neb-right" style={{ opacity: 0 }}>
          <div className="neb-side-copy">
            <h2 className="neb-h2">{h.fullstackTitle}</h2>
            <p className="neb-para">{h.fullstackBody}</p>
          </div>
        </section>

        {/* 4 — system design */}
        <section className="neb-sec neb-left" style={{ opacity: 0 }}>
          <div className="neb-side-copy">
            <h2 className="neb-h2 neb-h2-wrap">
              {h.systemTitle.split("\n").map((line, i) => (
                <span key={i}>
                  {i > 0 ? <br /> : null}
                  {line}
                </span>
              ))}
            </h2>
            <p className="neb-para">{h.systemBody}</p>
            <ul className="neb-benefit-list">
              <li>{h.systemLi1}</li>
              <li>{h.systemLi2}</li>
            </ul>
          </div>
        </section>

        {/* 5 — process */}
        <section className="neb-sec neb-right" style={{ opacity: 0 }}>
          <div className="neb-side-copy">
            <h2 className="neb-h2">{h.processTitle}</h2>
            <p className="neb-para">{h.processBody}</p>
          </div>
        </section>

        {/* 6 — expertise */}
        <section id="expertise" className="neb-sec neb-expertise" style={{ opacity: 0 }}>
          <h2 className="neb-expertise-title">{h.expertiseTitle}</h2>
          <div className="neb-cols">
            <div className="neb-col">
              <h4>{h.colFrontend}</h4>
              <ul>
                <li>{h.fe1}</li>
                <li>{h.fe2}</li>
                <li>{h.fe3}</li>
              </ul>
            </div>
            <div className="neb-col">
              <h4>{h.colBackend}</h4>
              <ul>
                <li>{h.be1}</li>
                <li>{h.be2}</li>
                <li>{h.be3}</li>
              </ul>
            </div>
            <div className="neb-col">
              <h4>{h.colInteractive}</h4>
              <ul>
                <li>{h.ix1}</li>
                <li>{h.ix2}</li>
                <li>{h.ix3}</li>
              </ul>
            </div>
            <div className="neb-col">
              <h4>{h.colProduct}</h4>
              <ul>
                <li>{h.pr1}</li>
                <li>{h.pr2}</li>
                <li>{h.pr3}</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 7 — about / craft */}
        <section className="neb-sec neb-team" style={{ opacity: 0 }}>
          <h2 className="neb-team-title">{h.principlesTitle}</h2>
          <div className="neb-team-row">
            <span className="neb-name">{h.pQuality}</span>
            <span className="neb-name neb-outline">{h.pPrecision}</span>
            <span className="neb-name">{h.pArchitecture}</span>
            <span className="neb-name-break" aria-hidden="true" />
            <span className="neb-name neb-outline">{h.pMotion}</span>
            <span className="neb-name">{h.pClarity}</span>
          </div>
        </section>

        {/* 8 — contact */}
        <section id="contact" className="neb-sec neb-contact" style={{ opacity: 0 }}>
          <a className="neb-email" href="/contact">
            {h.ctaEmail}
          </a>
          <div className="neb-footer">
            <div className="neb-divider" />
            <div className="neb-foot-links">
              <a href="/contact">{h.ctaContact}</a>
              <a href="/works">{h.ctaWorks}</a>
              <a href="https://github.com/highnd" target="_blank" rel="noreferrer">
                {h.ctaGithub}
              </a>
            </div>
          </div>
        </section>

        <div className="neb-rail">
          {Array.from({ length: STOPS }).map((_, i) => (
            <div className="neb-dot" key={i} />
          ))}
        </div>
        <div className="neb-hint">{h.scrollHint}</div>
      </div>

      <div className="neb-spacer" />
    </div>
  );
}
