# 0003 - The contact opt-in decision was inline in the route, untested

## Symptom

In the first cut of the contact endpoint (spec 0011), the mailing-list opt-in gate lived inline in
`app/v1/contact/route.ts` as `if (input.subscribe === true && ...)`. The tester persona flagged
(major) that this had zero coverage: nothing exercised the strict-`=== true` boundary, so a
regression to a truthy `if (input.subscribe)` would silently enrol a bot posting `"on"` / `1`, and
no test would fail. The route imports `next/server`, so `node --test` cannot load it - the decision
was untestable where it sat.

## Root cause

A regression-prone decision was left in the thin HTTP shell instead of the pure, node-testable
core. The route is exactly the layer that unit tests cannot reach.

## Fix

Extracted `shouldContactSubscribe(value: unknown): boolean` into the import-free `src/lib/contact.ts`
leaf (returns `value === true`) and called it from the route. Added a unit test asserting it enrols
only on a real boolean `true` and rejects `"on"` / `"yes"` / `1` / `undefined` / `false`, so a
truthiness regression now fails a test.

## Learning

This is the same rule already logged in `overview/learnings.md`: *do not leave a
regression-prone decision inline in a Next route handler - it is not node-testable; extract the pure
decision into an import-free lib leaf and unit-test it there.* The learning generalized correctly;
this is a second instance of it (the opt-in gate, alongside the original IP-keying / body-cap / guard
ordering), so no new learning is added - the existing one is reinforced. Watch for it on every new
route: any branch a bot or a malformed body can steer belongs in a tested leaf, not the shell.
