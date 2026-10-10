# Nebula — 3D Particle Agency Website

A full-page 3D particle experience built with **React + three.js**. One
persistent WebGL field of ~56,000 glowing particles lives in true 3D space and
is driven entirely by scroll. The same particles explode into a deep starfield
and magnetically re-form into a sequence of 3D objects across seven cinematic
sections, with a dollying camera, mouse parallax, depth fog, and a cursor-driven
hover repulsion field.

No animation libraries — the morph is hand-rolled on a single `requestAnimationFrame`
loop with a scroll-to-progress mapping.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL.

## Build

```bash
npm run build      # type-checks, then builds to dist/
npm run preview    # serves the production build locally
```

## How it works

- **One particle system.** A single `THREE.Points` with a `BufferGeometry` and an
  additive `ShaderMaterial`. Every section is just a different set of target
  positions and colors for the same particles.
- **Scroll drives everything.** Scroll position is mapped to a continuous
  progress value, smoothed, and used to morph between the per-section targets.
- **Self-contained.** All markup and CSS are injected by the component in
  `src/NebulaAgency.tsx`. The only assets are code — no images or models.

## Customise

Open `src/NebulaAgency.tsx`:

- **Copy & sections** — the JSX at the bottom holds the headlines, paragraphs,
  expertise columns, team names, and contact details. Edit them freely.
- **Colors** — the palette constants (`P_WHITE`, `P_GOLD`, `P_BLUE`, …) near the
  top tune the particle glow.
- **Shapes** — the `build*` functions hand-assemble each 3D object (rocket, atom,
  globe, mascot). Adjust their emitters to reshape the forms.
- **Feel** — `SPIN`, `BREATHE`, `STAGGER`, and the hover-radius/push constants
  control motion and the cursor repulsion strength.

## Tech

- React 19
- three.js
- Vite + TypeScript
