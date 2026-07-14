# Learnings

- **A design-system-wide bug belongs in the design system, not an app-level override.** Subscribe
  inputs auto-zoomed on iOS because Canopy's `Input` defaulted to `text-sm` (14px, under iOS's 16px
  zoom threshold) (feedback 0002). The first fix pinned `text-base` on the app's inputs - a stopgap
  that every other consumer would have had to repeat. The real fix moved into Canopy (`text-base
  md:text-sm` on `Input`/`Textarea`/`Select`, shipped in @rogueoak/canopy 0.10.1), and this app now
  just consumes the default with no override. **How to apply:** when a symptom traces to a shared
  component's default, fix it upstream and delete the local patch, rather than overriding in each
  consumer. Keep an app-level override only for genuinely app-specific needs.

- **Public-facing copy on a business site is written in the third person, not the first person.**
  rogueoak.com is Rogue Oak's site, not a personal one, so its privacy policy speaks about "Rogue
  Oak" (and "you"), never "I/my". **How to apply:** keep site copy in the brand's third-person voice;
  reserve first person for genuinely personal sites.

- **Verify JS/interactive behavior against a production build, not the dev server over LAN.**
  Next.js dev-mode client runtime does not reliably hydrate when the page is opened from a different
  host than the dev server, so scroll/observer JavaScript silently never ran on a phone hitting the
  LAN dev URL - while SSR HTML and CSS worked fine. **How to apply:** when a device shows content but
  no JS behavior, suspect dev-over-LAN hydration first; test with `node .next/standalone/server.js`
  (or a real deploy), not `next dev`, before blaming the device or the code.

- **Prefer a CSS-only implementation for entrance/visual effects when JS reliability is uncertain.**
  The scroll-reveal churned through IntersectionObserver, a scroll listener, and getBoundingClientRect
  measurement - all fragile across environments. A plain CSS keyframe fade (with `both` fill so
  content always ends visible) was the robust answer and can never leave content blank. **How to
  apply:** reach for CSS animation/transition before JS for entrances; add JS only when the effect
  needs real runtime state.

- **Use one language per module type; do not split `.js`/`.ts` for "testability".** Node's test
  runner strips TypeScript types on import, so pure logic can stay `.ts` and still be unit-tested
  with `node --test`. Keep correctness-critical modules typed. **How to apply:** author new `lib`
  modules as `.ts`; a `.mjs` test can import a `.ts` module directly.

- **A git worktree needs its own real `node_modules` - do not symlink the primary checkout's.**
  Turbopack (`next build`) rejects a `node_modules` symlink pointing outside the project root
  ("Symlink [project]/node_modules is invalid, it points out of the filesystem root") and panics;
  `node --test` and `eslint` follow the symlink fine, so the break only shows at build. **How to
  apply:** when building in `.worktrees/<slug>`, run `npm ci` inside the worktree (node_modules is
  git-ignored, so a fresh worktree has none) rather than symlinking back to the main checkout.

- **Keep a node-testable module import-free.** A module a `node --test` file imports directly must
  not use path aliases (`@/...`) or extensionless relative imports, which raw Node cannot resolve.
  Point dependents at it instead (e.g. `site.ts` reads from the import-free `content.ts`, not the
  reverse). **How to apply:** if `node --test` fails with ERR_MODULE_NOT_FOUND, invert the import
  direction so the tested module stays a leaf.

- **Do not leave security-relevant logic inline in a Next route handler - it is not node-testable.**
  A route handler imports `next/server` and uses `@/` aliases, so `node --test` cannot load it; any
  logic inside it (IP keying, body caps, guard ordering, status mapping) is untestable at the unit
  level and drifts unnoticed (feedback 0001, spec 0008). **How to apply:** extract the
  regression-prone, pure decisions into an import-free `lib` leaf and unit-test them there; keep the
  handler a thin orchestrator and cover its wiring with a production-build smoke test. Bound a
  request body on ACTUAL bytes read, not the client-declared `Content-Length` (absent/spoofable).

## Zero-downtime deploy on a cohosted box (spec 0005)

- **A blue/green rollout briefly doubles the container's memory, and on a SHARED host that peak
  must fit alongside the cohosted site's own peak.** rogueoak and matthewmaynes run on one small VM
  behind one Caddy; matthewmaynes' first rollout OOM'd the box (its feedback 0015) because two of its
  instances plus rogueoak exceeded RAM. rogueoak's rollout adds the same 2x transient. Guard the same
  way: a per-service `mem_limit` so one stack can't starve the box and take the neighbour down, and
  rely on the host headroom (RAM + swap) provisioned for both overlaps. Size for the sum of the peaks,
  not one site in isolation.
- **Keep the two cohosted deploys symmetric.** rogueoak's deploy mirrors matthewmaynes' (same pinned
  docker-rollout, `docker rollout`, post-rollout health gate, `timeout-minutes`, `prune -af`,
  clone-if-missing), differing only where it must: this repo never manages the shared Caddy (that repo
  owns the edge proxy) and has no image prewarm job. Symmetric pipelines mean a fix or hardening in one
  (like the OOM guards) ports directly to the other.

## Constant Contact: a "long-lived" refresh token still expires from inactivity (spec 0009)

- **A long-lived CTCT refresh token is not immortal - it expires after ~180 days of NON-USE, and the
  idle clock resets only when the token is exercised.** The cohosted matthewmaynes.com subscribe went
  down this way (its token silently expired), and rogueoak runs the identical subscribe code against
  its own long-lived token, so it had the same latent failure - just not yet triggered. The old
  `subscribe.ts` comment calling the token "non-rotating ... nothing to persist" was half right (they
  do not rotate) but hid this failure mode.
- **A lazy token mint on a low-traffic endpoint is a latent time bomb.** The route mints an access
  token only on a real subscribe, then caches it ~24h - so on a quiet site the refresh token can go
  unused for months. Deploys do not exercise it (the cache is lazy). Any credential kept alive only as
  a side effect of user traffic will eventually die in a lull; exercise it on a fixed schedule (cron),
  independent of traffic - a daily `ctct refresh-token` (the ctct-cli container) against the same
  `.env.site`, with a Resend email alert on failure. This is the same fix shipped on matthewmaynes;
  keeping the two cohosted sites symmetric (see the deploy note above) means the mitigation ports
  directly - one tested CLI implementation, not duplicated curl in each repo.
- **rogueoak has no Resend credentials of its own** (subscribe only, no contact form), so the
  keepalive's alert reuses the shared owner's Resend key, added to rogueoak's host `.env.site` purely
  for the cron. Re-auth when a token is truly dead is a device-flow browser approval (public client,
  no redirect URI); steps are in `deploy/README.md`.
