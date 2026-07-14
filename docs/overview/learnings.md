# Learnings

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

## Zero-downtime deploy on a cohosted box (spec 0006)

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
