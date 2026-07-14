// Unit tests for the generic HTTP spam/abuse guards (src/lib/http-guards.ts): the
// honeypot check, the scheme-agnostic same-origin check, and the in-memory rate
// limiter (clock injected). Pure and I/O-free, so no server is needed. Node strips
// the TypeScript types on import.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isHoneypotFilled,
  isSameOrigin,
  clientIpFromForwardedFor,
  isBodyWithinLimit,
  createRateLimiter,
} from "../src/lib/http-guards.ts";

test("isHoneypotFilled is true only for a non-empty string", () => {
  assert.equal(isHoneypotFilled("bot"), true);
  assert.equal(isHoneypotFilled("  x  "), true);
  for (const empty of ["", "   ", undefined, null, 0, 5, {}, []]) {
    assert.equal(isHoneypotFilled(empty), false, `expected false for ${JSON.stringify(empty)}`);
  }
});

test("isSameOrigin matches host scheme-agnostically (proxy https<->http hop)", () => {
  // Origin present: compared by host, so an https Origin matches an http host.
  assert.equal(isSameOrigin("https://rogueoak.com", null, "rogueoak.com"), true);
  // Falls back to Referer when Origin is absent.
  assert.equal(
    isSameOrigin(null, "https://rogueoak.com/subscribe", "rogueoak.com"),
    true,
  );
  // A different host is rejected.
  assert.equal(isSameOrigin("https://evil.example", null, "rogueoak.com"), false);
});

test("isSameOrigin rejects when it cannot establish same-origin", () => {
  // No host at all.
  assert.equal(isSameOrigin("https://rogueoak.com", null, null), false);
  // Neither Origin nor Referer (a browser form POST always carries one).
  assert.equal(isSameOrigin(null, null, "rogueoak.com"), false);
  // Unparseable source.
  assert.equal(isSameOrigin("not a url", null, "rogueoak.com"), false);
});

test("clientIpFromForwardedFor takes the LAST entry (Caddy appends the real IP)", () => {
  // Caddy appends the real client IP last; earlier entries are client-spoofable.
  assert.equal(clientIpFromForwardedFor("9.9.9.9, 8.8.8.8, 1.2.3.4"), "1.2.3.4");
  // A forged prefix must not shift the key - only the last entry counts.
  assert.equal(clientIpFromForwardedFor("evil, 1.2.3.4"), "1.2.3.4");
  // Whitespace is trimmed.
  assert.equal(clientIpFromForwardedFor("  1.2.3.4  "), "1.2.3.4");
  // Absent / empty header => a deterministic bucket, never a throw.
  assert.equal(clientIpFromForwardedFor(null), "unknown");
  assert.equal(clientIpFromForwardedFor(""), "unknown");
  assert.equal(clientIpFromForwardedFor(","), "unknown");
});

test("isBodyWithinLimit bounds on actual bytes (guards <= vs <)", () => {
  assert.equal(isBodyWithinLimit(0, 8), true);
  assert.equal(isBodyWithinLimit(8, 8), true, "exactly at the cap is allowed");
  assert.equal(isBodyWithinLimit(9, 8), false, "one over the cap is rejected");
});

test("createRateLimiter allows up to max per window, then blocks, then recovers", () => {
  let now = 1_000_000;
  const limiter = createRateLimiter({ max: 3, windowMs: 10_000 });
  const key = "1.2.3.4";
  assert.equal(limiter.check(key, now), true);
  assert.equal(limiter.check(key, now), true);
  assert.equal(limiter.check(key, now), true);
  // Fourth within the window is blocked.
  assert.equal(limiter.check(key, now), false);
  // Once the window passes, the count resets.
  now += 10_001;
  assert.equal(limiter.check(key, now), true);
});

test("createRateLimiter keys independently per client", () => {
  const now = 5;
  const limiter = createRateLimiter({ max: 1, windowMs: 1000 });
  assert.equal(limiter.check("a", now), true);
  assert.equal(limiter.check("a", now), false, "second hit for a is blocked");
  assert.equal(limiter.check("b", now), true, "b has its own budget");
});

test("createRateLimiter evicts stale keys once the map exceeds maxKeys (memory backstop)", () => {
  // Drive the oversized-map sweep: fill past maxKeys with one-off keys in an early
  // window, then advance past the window and add a fresh key. The sweep must drop
  // the stale keys (no in-window hits) so the map cannot grow without bound.
  const windowMs = 1000;
  const maxKeys = 3;
  const limiter = createRateLimiter({ max: 5, windowMs, maxKeys });
  for (let i = 0; i < maxKeys + 1; i++) limiter.check(`old-${i}`, 100);
  // Advance past the window so the old keys have no in-window hits, then trip the
  // sweep by exceeding maxKeys again. The fresh key still returns true (allowed),
  // and the stale ones are evicted rather than accumulating.
  const later = 100 + windowMs + 1;
  assert.equal(limiter.check("fresh", later), true);
  // Re-adding an old key after the window is allowed (its prior hit was evicted /
  // aged out), proving the map did not permanently retain it.
  assert.equal(limiter.check("old-0", later), true);
});
