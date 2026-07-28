# 0004 - Document assembly and the JSON-LD escape lived untested in thin shells

## Symptom

In the first cut of spec 0013, the tester persona flagged two majors:

1. The `<` -> `<` script-breakout escape (the exact guard the spec scoped in) lived inline in
   the `JsonLd` component (`src/components/json-ld.tsx`) with zero coverage. A regression that dropped
   the `.replace(...)` would ship green, since a `.tsx` component is not loaded by `node --test`.
2. The `llms.txt` route handler was described in a test comment as a "thin shell", but it
   carried real assembly logic that only lived there and was proven by nothing: the rogueoak
   `(status)` suffix on coming-soon product notes. The shipped tests exercised only the pure
   `renderLlmsTxt` primitive, not the assembly.

## Root cause

Regression-prone logic was left in the layers `node --test` cannot reach - a React component and a
Next route handler (both import `@/` aliases / server or JSX runtime). The "thin shell" framing was
used to justify skipping coverage, but the shells were not thin: they held the transform and the
escape, which are exactly where a silent regression lands.

## Fix

Extracted the logic into the import-free, node-testable leaves and covered it:

- `serializeJsonLd(data)` moved to `src/lib/structured-data.ts`; `JsonLd` now calls it. Tests assert
  every `<` in a `</script>` / `<!--` / `<![CDATA[` payload is escaped and the output round-trips.
- `buildSiteLlmsDoc` moved to `src/lib/llms.ts`; the route handler now only wires content in and
  renders. Tests assert the `(status)` suffix, the summary join, and the language rules (ASCII, no
  ` - ` break) against the real content records.

## Learning

Same rule as feedback 0001/0003, but it generalizes past *security* logic and past *route handlers*:
**any non-trivial logic in a layer `node --test` cannot load - a route handler OR a React component -
is untestable where it sits and drifts unnoticed.** "It is a thin shell" is only true if the shell
holds no transform, decision, or escape; if it does, that logic is a real code path and belongs in an
import-free `lib` leaf with a unit test. Broadened the existing learning in `overview/learnings.md`
accordingly.
