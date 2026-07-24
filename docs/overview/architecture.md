# Architecture

Next.js 16 (App Router) + React 19 + TypeScript, `output: "standalone"`, npm. Mirrors
matthewmaynes.com, the reference Canopy consumer. A multi-page site (spec 0011): a shared root
layout wraps a Canopy `TopNav` (About / Tools / Products / Contact) and the footer around each
route. Routes: `/` (pitch), `/about`, `/tools` + `/tools/[slug]` (spectra/trellis/canopy),
`/products` + `/products/[slug]` (thought-stream/branch-out), `/contact`, plus `/subscribe` and
`/privacy`. The `[slug]` routes use `generateStaticParams` + `dynamicParams = false` (unknown slugs
404) and each ships a route-level `opengraph-image` that renders the item's card from its content
record, so tool/product pages, their metadata, and their share previews all derive from one source.
`SiteNav` is the only nav client island (`usePathname` for the active link); TopNav owns the mobile
disclosure. Shared render components: `ProductList` (listings) and `ProductPage` (detail).

- **Design system**: Canopy 1.2 via published npm packages - `@rogueoak/roots` (design tokens + a
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
- **Contact (spec 0011)**: mirrors matthewmaynes' contact flow. The pure, import-free
  `src/lib/contact.ts` (validate, HTML-escape, notification render, Resend payload + injectable
  send) carries the logic; `app/v1/contact/route.ts` is a thin shell reusing `http-guards.ts`
  (honeypot, same-origin, per-IP rate limit, actual-byte body cap), reading `RESEND_API_KEY` /
  `CONTACT_TO_EMAIL` / `CONTACT_FROM_EMAIL` from server env (fail closed), and - when the opt-in box
  is ticked - calling the existing `submitSubscription` against the single "Rogue Oak" list. The
  on-brand `emails/templates/contact-notification.html` is read at runtime (bundled via
  `next.config.ts` `outputFileTracingIncludes`). The form (`contact-form.tsx`) is a `"use client"`
  island using Canopy `Input` / `Textarea` / `Checkbox` / `FormField` (through `ui.ts`), posting
  JSON with PII-free analytics.
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
- **Deploy (spec 0005, zero-downtime; symmetric with matthewmaynes spec 0019):** on push to `main`,
  the `deploy` job in `release.yml` (needs: build) SSHes into a DigitalOcean droplet as `deploy` and
  rolls the site to the `sha-<commit>` image with **no user-visible downtime**. This site is
  **cohosted with matthewmaynes.com**: that repo owns the shared **Caddy** edge proxy (terminates
  TLS, auto Let's Encrypt, the only stack publishing 80/443) and routes `rogueoak.com` ->
  `rogueoak:3000` over the shared external `edge` network. This repo ships only the **rogueoak** site
  stack (`deploy/docker/compose.site.yml`, service `rogueoak`, no host port); it never manages Caddy.
  Instead of `compose up -d` recreating one fixed-name container in place (a hard-down window), the
  deploy uses [`docker-rollout`](https://github.com/Wowu/docker-rollout) (pinned, checksum-verified)
  to scale `rogueoak` to two Compose-indexed instances, wait for the new HEALTHCHECK, then remove the
  old. `container_name` is dropped so the two can coexist (the `rogueoak` alias is kept); the
  matthewmaynes Caddy proxy resolves the `rogueoak` alias via **dynamic-A upstreams** (re-resolving
  Docker DNS), so it follows the swap. A post-rollout health gate curls rogueoak.com through Caddy
  over loopback and fails the deploy on a non-200; a `timeout-minutes` bounds a wedged host. A broken
  image never goes healthy, so the old instance keeps serving and the deploy fails. The deploy is
  self-bootstrapping (clones the repo, ensures the `edge` network exists), pre-pulls, and label-scoped
  prunes. The pipeline is kept **symmetric with matthewmaynes'**, differing only where it must (this
  repo never manages the shared Caddy, has no image prewarm job, and uses rogueoak names). A
  per-service `mem_limit` keeps a rollout's transient 2x footprint from OOM-ing the shared VM and
  taking down the cohosted site (matthewmaynes feedback 0015). Serves `https://rogueoak.com`
  (`www` -> apex). Since spec 0008 the site stack reads its runtime secrets from a host-side,
  git-ignored `deploy/docker/.env.site` (`env_file`, `required: false`), never tracked or baked into
  the image. **Since spec 0011 the deploy job generates that file on every deploy from GitHub Actions
  Secrets** (the six runtime values - `CTCT_*`, `RESEND_API_KEY`, `CONTACT_TO/FROM_EMAIL`), assembled
  into a base64 blob on the runner, piped to the box over stdin (not an argv, so no `ps` exposure),
  and decoded into `.env.site` (chmod 600) on the droplet so no secret touches the remote command
  line or the logs. A deploy warns if a required secret is empty rather than blanking it. GHA is the single source of truth (a re-minted CTCT
  token is updated in the Secret, not the box); this diverges intentionally from matthewmaynes, which
  still hand-creates its file. The same file feeds the keepalive cron (spec 0009). Missing file =>
  the affected route fails closed, the rest of the site is unaffected.
