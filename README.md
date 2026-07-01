# rogueoak.com

The one-page marketing site for Rogue Oak - the home base for Spectra, Trellis,
and Canopy. Built with Next.js 16 (App Router), React 19, TypeScript, and the
Canopy design system on Tailwind v4.

The page tells the Rogue Oak name story and shows the three products, themed
entirely by Canopy's semantic tokens (light and dark), with a subtle scroll
reveal that respects reduced-motion preferences.

## Requirements

- Node.js 22 or newer (the tests use Node's built-in TypeScript type stripping).

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Scripts

- `npm run dev` - start the dev server.
- `npm run build` - production build (`output: "standalone"` under `.next/standalone`).
- `npm start` - serve the production build.
- `npm run lint` - ESLint (Next core-web-vitals + TypeScript rules).
- `npm test` - Node's built-in test runner over `tests/*.test.mjs`.

## Canopy

Components come from `@rogueoak/canopy` and are re-exported through the
`"use client"` barrel at `src/components/ui.ts`. Import Canopy from there, not
from `@rogueoak/canopy/*` directly: the published build evaluates React context
at module scope with no `"use client"` directive, so importing it straight into a
Server Component fails the build. The barrel puts it on the client side of the
RSC boundary.

Styling uses Canopy's semantic-token Tailwind utilities only (for example
`bg-surface`, `text-text-muted`, `text-h2`) on the default moss / bark / stone /
amber palette.

## Configuration

Copy `.env.example` to `.env.local` and adjust as needed. All variables are
optional for local development; see the file for details. PostHog analytics only
captures from a deployed, non-local production build, so local dev and a local
production build never report.
