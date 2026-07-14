# 0001 - Subscribe route handler has no automated coverage

Source: Spectra tester persona review on PR #19 (spec 0008), flagged **major**.

## Symptom

`src/app/v1/subscribe/route.ts` - the public POST handler - had zero automated tests. Its pure
dependencies (`src/lib/subscribe.ts`, `src/lib/http-guards.ts`) are thoroughly unit-tested, but the
handler itself owns load-bearing, security-relevant behavior that lived nowhere else in tests: the
`X-Forwarded-For` last-entry IP keying (an anti-spoof choice a refactor could silently reverse), the
spec-mandated guard ORDERING (test-domain short-circuit before the rate limiter and before any env
read), the body-size cap, and the 413/400/403/500 status mapping. It was only smoke-tested by hand.

## Root cause

`node --test` cannot import the route module: it pulls in `next/server` and uses `@/...` path
aliases, which raw Node cannot resolve (see the "node-testable module import-free" learning). So the
handler is structurally outside the unit-test harness, and there is no server-boot integration
harness in this repo. The result: the most regression-prone logic sat in the one file the suite
could not reach.

## Fix

Push the pure, regression-prone decisions OUT of the handler into the import-free
`src/lib/http-guards.ts` leaf, where `node --test` can cover them, leaving the handler a thin
orchestrator:

- `clientIpFromForwardedFor(xff)` - the last-`X-Forwarded-For`-entry anti-spoof extraction, now
  unit-tested (forged prefix does not shift the key; absent header => `"unknown"`).
- `isBodyWithinLimit(byteLength, max)` - the body cap, now enforced on ACTUAL bytes read
  (`req.text()` + `Buffer.byteLength`) rather than only the client-declared `Content-Length`, which
  closed a related minor (a missing/spoofed length header bypassed the old check). Unit-tested.
- Added a test for the rate limiter's oversized-map eviction sweep (the memory backstop).

The remaining orchestration (ordering, status mapping) stays in the handler and is covered by the
production-build smoke test (6 branches: test-domain 200, no-env 500, invalid 400, honeypot 200,
cross-origin 403, GET 405).

## Learning

Route handlers are not node-testable here, so **security-relevant logic must not live inline in a
Next route handler** - extract it into a pure, import-free `lib` leaf and unit-test it there; keep
the handler a thin orchestrator covered by a smoke test. Generalizes past this feature; feeds
`overview/learnings.md`.
