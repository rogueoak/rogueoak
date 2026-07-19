# 0010 - Language overhaul and a Coming Soon section

## Problem

The site leans on one phrase everywhere: "Tools built to stand on their own." It frames Rogue
Oak as a maker of standalone *tools*, when Rogue Oak builds *software* - with a relentless focus
on value, experience, and quality. The copy undersells that. Separately, there is no home on the
site for early-stage work, so the first new product (Thought Stream) has nowhere to appear before
it ships.

For: anyone landing on rogueoak.com - prospective users of the products, and people sizing up what
Rogue Oak is about.

## Outcome

- The master tagline reads "Software built to last." on the hero, the share card, and the search
  snippet - no copy still calls the work "tools built to stand on their own."
- The positioning copy (meta description, the oak name story) names value, experience, and quality
  as the through-line, and says "software," not "tools."
- A new "Coming soon" section sits between Projects and Subscribe, leading with Thought Stream: its
  app icon, a one-line pitch, two to three concrete benefits, an "In early development" marker, and
  a link to github.com/rogueoak/thought-stream.

## Scope

In:
- `src/lib/content.ts` - tagline, oak story, and a new `comingSoon` data block + type.
- `src/lib/site.ts` - meta/OG description and OG image alt.
- `src/components/coming-soon.tsx` (new) + wiring into `src/app/page.tsx`.
- `public/thought-stream-logo.svg` - the Thought Stream app icon.
- `emails/templates/welcome.html` - the footer tagline.
- `tests/content.test.mjs` - assertions for the new tagline, story, and coming-soon data.
- `docs/overview/features.md` - reflect the new tagline and section.

Out:
- No new page or route; Thought Stream has no page of its own yet.
- No design-system changes; the section reuses existing Canopy tokens and the `Button`.

## Approach

Copy lives in one import-free module (`content.ts`) that `site.ts` and the tests both read, so the
tagline can only be stated once. The Coming Soon section mirrors the Projects component but renders
a square app icon (rounded like an app tile) and an "In early development" badge, so it reads as
not-yet-shipped rather than a fourth shipped product. Thought Stream's only brand asset is its
1024x1024 app icon; it is copied verbatim into `public/` rather than commissioning a wordmark.

Tagline chosen: "Software built to last." - keeps the oak's longevity, drops "tools," and lets the
value/experience/quality message carry in the copy below.

## Acceptance

- [ ] Hero, OG card, and meta description show the new tagline; no "stand on their own" product copy
      remains in `src/`, `emails/`, or the tests.
- [ ] Coming Soon section renders Thought Stream between Projects and Subscribe with icon, pitch,
      benefits, "In early development", and a working GitHub link.
- [ ] `npm test`, `npm run lint`, and `npm run build` all pass.
