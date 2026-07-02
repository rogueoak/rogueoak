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

- **Keep a node-testable module import-free.** A module a `node --test` file imports directly must
  not use path aliases (`@/...`) or extensionless relative imports, which raw Node cannot resolve.
  Point dependents at it instead (e.g. `site.ts` reads from the import-free `content.ts`, not the
  reverse). **How to apply:** if `node --test` fails with ERR_MODULE_NOT_FOUND, invert the import
  direction so the tested module stays a leaf.
