# Architecture

Next.js 16 (App Router) + React 19 + TypeScript, `output: "standalone"`, npm. Mirrors
matthewmaynes.com, the reference Canopy consumer.

- **Design system**: Canopy via published npm packages - `@rogueoak/roots` (design tokens + a
  Tailwind v4 preset), `@rogueoak/canopy` (React components), `@rogueoak/icons`. `globals.css`
  imports Tailwind, the roots tokens + preset, the Figtree/Geist Mono fonts, then
  `theme-rogueoak.css`, which re-points the dark semantic tokens to the navy/green/amber
  product-banner palette. The site is dark-only (`.dark` fixed on `<html>`; no toggle).
- **RSC boundary**: Canopy's published build ships no `"use client"` directives and reads React
  context at module scope, so every Canopy component is re-exported through one `"use client"`
  barrel, `src/components/ui.ts`, and imported from there.
- **Content & config**: page copy lives in `src/lib/content.ts` (kept import-free so `node --test`
  can load it directly); `src/lib/site.ts` derives the brand name/tagline from it so metadata and
  the hero never drift.
- **Analytics**: `src/lib/analytics-env.ts` is the pure, unit-tested capture gate;
  `posthog-browser.ts` plus the provider/pageview components wire the client SDK; `next.config.ts`
  sets up the same-origin `/ingest` reverse proxy to PostHog US Cloud.
- **Reveal**: a pure-CSS fade-up on load (`.reveal` + a keyframe, `both` fill). JS/observer/scroll
  approaches were tried and dropped - see learnings.
- **Assets**: brand SVGs (org + product logos, matthewmaynes.com favicon) live in `public/`; the
  repo is standalone and cannot reach sibling repos at build time.
- **Tests**: Node's built-in runner (`node --test`, `tests/*.test.mjs`).
- **CI**: `.github/workflows/verify.yml` is a reusable (`workflow_call`) gate - `npm ci`, lint,
  build, test on Node 24 - called by `ci.yml` on every PR to `main`. Written reusable so the deploy
  pipeline runs the identical gate. Actions are SHA-pinned; Dependabot keeps the pins current.
- **Deploy shape (planned)**: standalone Docker image -> GHCR -> DigitalOcean droplet behind Caddy.
