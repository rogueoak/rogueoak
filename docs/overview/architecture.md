# Architecture

Next.js 16 (App Router) + React 19 + TypeScript, `output: "standalone"`, npm. Mirrors
matthewmaynes.com, the reference Canopy consumer.

- **Design system**: Canopy via published npm packages - `@rogueoak/roots` (design tokens + a
  Tailwind v4 preset), `@rogueoak/canopy` (React components), `@rogueoak/icons`. `globals.css`
  imports Tailwind, the roots tokens + preset, then the Rogue Oak brand
  (`brand-rogueoak.generated.css`), `theme-rogueoak.css`, and the Figtree/Geist Mono fonts. The
  brand re-points the dark semantic tokens to the navy/green/amber product-banner palette; it is
  **generated** by the roots brand pipeline (`npm run theme:build`) from the DTCG sources in
  `brand/rogueoak/` (a partial, dark-only brand - it maps only the `.dark` roles and inherits the
  rest from Roots), and `theme-rogueoak.css` keeps only the non-palette `color-scheme: dark`. The
  site is dark-only (`.dark` fixed on `<html>`; no toggle).
- **RSC boundary**: Canopy's published build ships no `"use client"` directives and reads React
  context at module scope, so every Canopy component is re-exported through one `"use client"`
  barrel, `src/components/ui.ts`, and imported from there.
- **Content & config**: page copy lives in `src/lib/content.ts` (kept import-free so `node --test`
  can load it directly); `src/lib/site.ts` derives the brand name/tagline from it so metadata and
  the hero never drift.
- **Analytics**: `src/lib/analytics-env.ts` is the pure, unit-tested capture gate;
  `posthog-browser.ts` plus the provider/pageview components wire the client SDK; `next.config.ts`
  sets up the same-origin `/ingest` reverse proxy to PostHog US Cloud.
- **Subscribe (spec 0008)**: the site's first server-side behavior and first server secret. The pure,
  import-free (node-testable leaf) cores `src/lib/subscribe.ts` (validate, `sign_up_form` shaping,
  OAuth refresh + token cache with 401 self-heal) and `src/lib/http-guards.ts` (honeypot,
  same-origin, in-memory rate limiter) carry all the logic; `app/v1/subscribe/route.ts` is a thin
  HTTP shell that reads `CTCT_CLIENT_ID` / `CTCT_REFRESH_TOKEN` / `CTCT_LIST_ID` from server env and
  maps outcomes to status codes. Credentials never cross the client boundary; unset env fails closed.
  An `@rogueoak.com` email short-circuits to a simulated success (no Constant Contact call) so the
  UX is exercisable without throwaway contacts. The form (`subscribe-form.tsx`) is a `"use client"`
  island using Canopy `Input` / `FormField` (re-exported through `ui.ts`). Mirrors matthewmaynes spec
  0018, trimmed to one list / opt-in only (no CRM record). The welcome email lives in `emails/` as a
  standalone HTML file (created in Constant Contact via the `ctct` CLI, not read at runtime).
- **Reveal**: a pure-CSS fade-up on load (`.reveal` + a keyframe, `both` fill). JS/observer/scroll
  approaches were tried and dropped - see learnings.
- **Assets**: brand SVGs (org + product logos, matthewmaynes.com favicon) live in `public/`; the
  repo is standalone and cannot reach sibling repos at build time.
- **Tests**: Node's built-in runner (`node --test`, `tests/*.test.mjs`).
- **CI**: `.github/workflows/verify.yml` is a reusable (`workflow_call`) gate - `npm ci`, lint,
  build, test on Node 24 - called by `ci.yml` on every PR to `main`. Written reusable so the deploy
  pipeline runs the identical gate. Actions are SHA-pinned; Dependabot keeps the pins current.
- **Container**: multi-stage `Dockerfile` (deps -> build -> runtime) on `node:24-alpine` serving the
  standalone `server.js` as the non-root `node` user on port 3000, with a node-based healthcheck.
  `SITE_URL` is a build arg (baked into metadata at build time, not read at runtime). `.dockerignore`
  keeps the context lean/secret-free; `docker-compose.yml` runs the image locally.
- **Release**: `.github/workflows/release.yml` runs on push to `main` - the shared `verify` gate,
  then a `build` job that builds the image (with `--build-arg SITE_URL`) and pushes it to
  `ghcr.io/rogueoak/rogueoak` tagged `latest` + `sha-<full-sha>`. `packages: write` is scoped to the
  build job only; `no-cache` avoids stale-layer bugs. `cleanup-images.yml` prunes GHCR to the 30 most
  recent tagged images on a daily schedule.
- **Deploy**: on push to `main`, the `deploy` job in `release.yml` (needs: build) SSHes into a
  DigitalOcean droplet as `deploy` and rolls the site to the `sha-<commit>` image. This site is
  **cohosted with matthewmaynes.com**: that repo owns the shared **Caddy** edge proxy (terminates
  TLS, auto Let's Encrypt, the only stack publishing 80/443) and routes `rogueoak.com` ->
  `rogueoak:3000` over the shared external `edge` network. This repo ships only the **rogueoak** site
  stack (`deploy/docker/compose.site.yml`, project / service `rogueoak`, no host port).
  The deploy is self-bootstrapping (clones the repo, ensures the `edge` network exists) and
  label-scoped prunes; it no longer brings up Caddy. Serves `https://rogueoak.com` (`www` -> apex).
  Since spec 0008 the site stack reads the subscribe secrets from a host-side, git-ignored
  `deploy/docker/.env.site` (`env_file`, `required: false`), created once on the droplet and never
  tracked or baked into the image - mirroring the cohosted matthewmaynes stack. Missing file =>
  subscribe fails closed, the rest of the site is unaffected.
- **Zero-downtime deploy (spec 0006, symmetric with matthewmaynes spec 0019):** instead of
  `compose up -d` recreating the one fixed-name container in place (a hard-down window), the deploy
  uses [`docker-rollout`](https://github.com/Wowu/docker-rollout) (pinned, checksum-verified) to scale
  `rogueoak` to two Compose-indexed instances, wait for the new HEALTHCHECK, then remove the old.
  `container_name` is dropped so the two can coexist; the matthewmaynes Caddy proxy resolves the
  `rogueoak` alias via **dynamic-A upstreams** (re-resolving Docker DNS), so it follows the swap. A
  post-rollout health gate curls rogueoak.com through Caddy over loopback and fails the deploy on a
  non-200; a `timeout-minutes` bounds a wedged host. A broken image never goes healthy, so the old
  instance keeps serving and the deploy fails. The pipeline is kept **symmetric with matthewmaynes'**,
  differing only where it must (this repo never manages the shared Caddy, has no image prewarm job,
  and uses rogueoak names). A per-service `mem_limit` keeps a rollout's transient 2x footprint from
  OOM-ing the shared VM and taking down the cohosted site (matthewmaynes feedback 0015).
