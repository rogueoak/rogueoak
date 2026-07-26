# 0012 - Thought Buffer rename and thoughtbuffer.app hosting

## Problem

The "Thought Stream" product is being renamed to **Thought Buffer**, and it is getting its own
marketing home at **thoughtbuffer.app**. The rename touches this repo's product copy, slug, and
logo. The new domain must be served without standing up a second container: this site already runs
as a single Next.js container behind the shared Caddy proxy (rogueoak.com and matthewmaynes.com are
both routed there), and thoughtbuffer.app should join that same container so hosting stays cheap and
operationally simple (spec brief: "2 domains, 1 container").

The catch is that the app bakes its own base URL in at build time (`SITE_URL` -> `site.url`) and
assumes a single origin for metadata, robots, and the sitemap. A second domain served from the same
process needs its own identity for those, without turning the whole app "host-aware".

## Outcome

- Visiting **thoughtbuffer.app** serves a Thought Buffer marketing landing page (coming-soon +
  waitlist), from the same container that serves rogueoak.com.
- The landing reuses the existing subscribe flow (`/v1/subscribe` + Constant Contact) to capture a
  waitlist, tagged/listed separately from the rogueoak newsletter.
- thoughtbuffer.app has correct per-domain metadata: canonical URLs, Open Graph, `robots.txt`, and
  `sitemap.xml` all point at thoughtbuffer.app, never rogueoak.com.
- rogueoak.com is unchanged except that the product formerly called "Thought Stream" now reads
  **Thought Buffer** everywhere (card, detail page, logo, metadata), and its primary link points to
  thoughtbuffer.app.
- The old `/products/thought-stream` URL 308-redirects to `/products/thought-buffer`.
- The rogueoak.com route tree is not reachable on thoughtbuffer.app, and the internal
  `/thoughtbuffer` prefix is not reachable on rogueoak.com.

## Scope

**In**

- Rename Thought Stream -> Thought Buffer in `src/lib/content.ts` (name, `slug`, `logo`, `href`,
  `hrefLabel`, and the body/benefit copy that leans on the "stream" metaphor).
- Add the Thought Buffer wordmark + palette assets (reused from the app's `design/branding`).
- `src/middleware.ts`: route by `Host`. thoughtbuffer.app (+ www) rewrites into a fixed
  `/thoughtbuffer` subtree; the subtree is blocked (404) on any other host; rogueoak.com is
  untouched.
- A `/thoughtbuffer` route subtree with its own nested layout, metadata, `robots.txt`, and
  `sitemap.xml`, all hardcoded to thoughtbuffer.app.
- Thought Buffer landing page: hero, pitch, the three benefits, waitlist form, footer.
- Waitlist wiring: reuse `subscribe.ts` / `/v1/subscribe`, with a distinct Constant Contact
  list/tag for Thought Buffer.
- 308 redirect `/products/thought-stream` -> `/products/thought-buffer`.
- Update tests (`tests/`, `src/lib/content` assertions) and the `docs/overview/` living docs.

**Out**

- Caddy routing + DNS for thoughtbuffer.app. These live in the `matthewmaynes` repo and at the
  registrar; tracked separately, not in this repo.
- The iOS app rename (separate repo, `thought-buffer`).
- Making rogueoak.com itself multi-tenant or `SITE_URL` runtime-derived. rogueoak.com keeps its
  build-time `site.url`; only the new subtree hardcodes its own base URL.
- A full product site for Thought Buffer (multi-page, blog, docs). v1 is one landing page.

## Approach

**One app, two domains, fixed subtrees.** Because there are exactly two known domains (not arbitrary
tenants), each maps to a fixed route subtree rather than a dynamic `[domain]` segment:

- rogueoak.com -> the existing route tree (`/`, `/about`, `/tools`, `/products`, ...).
- thoughtbuffer.app -> `/thoughtbuffer/*`, via a `Host`-header rewrite in `src/middleware.ts`.

`src/middleware.ts` is the only host-aware code. Everything downstream is a normal, statically
addressed route, so each domain's metadata/robots/sitemap is hardcoded in its own subtree and the
app never has to read the request host to build a URL. Middleware responsibilities:

1. thoughtbuffer.app (and www.thoughtbuffer.app): rewrite `/<path>` -> `/thoughtbuffer/<path>`,
   and rewrite `/robots.txt` -> `/thoughtbuffer/robots.txt`, `/sitemap.xml` ->
   `/thoughtbuffer/sitemap.xml`.
2. Any other host requesting `/thoughtbuffer/*`: return 404 (the internal prefix is not public on
   rogueoak.com).
3. Leave the PostHog `/ingest/*` rewrites (in `next.config.ts`) and everything else alone.

**Per-domain identity without global host-awareness.** Only the root `app/layout.tsx` may render
`<html>`/`<body>`, so the two domains share that shell (and the pre-paint theme script). The
`/thoughtbuffer` subtree gets its own nested `layout.tsx` that exports metadata with
`metadataBase = new URL("https://thoughtbuffer.app")`, its own title/description/OG, and its own
nav/footer. `app/thoughtbuffer/robots.ts` and `app/thoughtbuffer/sitemap.ts` are hardcoded to
thoughtbuffer.app. The existing root `robots.ts`/`sitemap.ts` stay rogueoak-only.

**Waitlist reuse.** The landing's form posts to the existing `/v1/subscribe`. The route gains an
optional audience/list parameter so a Thought Buffer signup lands on a separate Constant Contact
list (or carries a tag), keeping the two audiences distinct. Reuses the existing
`subscribe-form.tsx` styling where possible.

**Assets.** The app's `design/branding/wordmark.svg` (now "Thought Buffer") becomes
`public/thought-buffer-logo.svg`; the River Mist palette (#9DBBBF / #6F979E / #4E7882, gold accent
#d2a463) drives the landing's accent styling.

## Key decisions and trade-offs

- **Fixed subtree over dynamic multi-tenant routing.** Two known domains do not need a
  `[domain]` catch-all or a tenant lookup. Fixed subtrees keep every URL statically analyzable and
  every base URL hardcoded, which is the whole reason the app avoids runtime host-awareness. Cost:
  adding a third domain later means another subtree + middleware branch (acceptable).
- **Shared container, coupled deploys.** One image serves both domains, so a deploy ships both at
  once. Accepted for a coming-soon landing; if Thought Buffer's site grows its own cadence, split it
  into a second app/image later (a known, documented exit).
- **Keep rogueoak.com build-time `SITE_URL`.** Not worth making rogueoak.com host-derived; only the
  new subtree needs a second identity, and it is a compile-time constant.
- **Keep a Thought Buffer card on rogueoak.com/products**, linking out to thoughtbuffer.app (same
  pattern as Branch Out Games -> branchout.games), rather than removing it. Preserves the products
  listing and gives thoughtbuffer.app an inbound link.

## Acceptance

- [ ] `content.ts` has no "Thought Stream" / "thought-stream" references; the product is
      Thought Buffer with slug `thought-buffer`, and copy no longer relies on the "stream" metaphor.
- [ ] `public/thought-buffer-logo.svg` exists and renders on the products card + detail page.
- [ ] `/products/thought-stream` returns a 308 to `/products/thought-buffer`.
- [ ] With `Host: thoughtbuffer.app`, `/` serves the Thought Buffer landing; `/about` (a
      rogueoak route) does not resolve as rogueoak content.
- [ ] With `Host: rogueoak.com`, `/thoughtbuffer` and `/thoughtbuffer/*` return 404.
- [ ] thoughtbuffer.app `robots.txt` and `sitemap.xml` reference thoughtbuffer.app only; rogueoak.com
      `robots.txt`/`sitemap.xml` reference rogueoak.com only.
- [ ] The landing's waitlist form submits to `/v1/subscribe` and records against a separate Thought
      Buffer list/tag.
- [ ] thoughtbuffer.app page metadata (canonical, OG url, `metadataBase`) resolves to
      https://thoughtbuffer.app.
- [ ] `npm test`, lint, and `npm run build` pass.

## Implementation notes

Refinements found while building (the overview `architecture` doc has the living version):

- **Chrome separation is a route group, not just a nested layout.** The root layout renders the
  Rogue Oak nav/footer, and a nested layout cannot remove parent chrome; a `Host`-rewrite also keeps
  the browser path at `/`, so a path-based gate cannot tell the two homes apart. So the rogueoak.com
  pages moved into an `app/(main)/` group whose layout owns the nav/footer + rogueoak metadata, the
  root layout keeps only `<html>/<body>` + PostHog, and the `/thoughtbuffer` subtree simply never
  inherits Rogue Oak chrome. This stays statically rendered (no `headers()` / host reads).
- **`proxy.ts`, not `middleware.ts`.** Next 16 renamed the convention; the file is `src/proxy.ts`
  exporting `proxy`.
- **The proxy re-runs on its own rewrite** with the server's host (not thoughtbuffer.app), which
  made every rewrite land on the blocked prefix. Fixed by tagging the rewrite with an `x-tb-rewrite`
  request header and short-circuiting the second pass.
- **Per-domain OG + favicon** are static assets in `public/` (`thought-buffer-og.png` from the app
  icon, `thought-buffer-icon.svg`) referenced by the subtree's metadata, avoiding the internal-prefix
  URL that a file-convention `opengraph-image` under `/thoughtbuffer` would generate.
- **TB robots/sitemap are route handlers** (`app/thoughtbuffer/robots.txt/route.ts`,
  `sitemap.xml/route.ts`), since the `robots.ts`/`sitemap.ts` metadata conventions are root-only.
- Verified by running the standalone server and probing both hosts with `Host` headers.
