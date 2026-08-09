# 0015 - Products returns: Branch Out Games and Famlistry

## Problem

Spec 0011 built `/products` and linked it from the nav and the home pitch. Spec #38 then
**unlinked** it, because the only product listed was not ready to be advertised: the pages kept
building and resolving, they just had no way in.

Two things changed since.

**Branch Out Games shipped.** branchout.games is live with sign-up, log-in, and three playable
games (Trivial Matters, Liar Liar, Lone Leaf). The site still describes it as "Coming soon" and
"Still on the way", which is now false: it tells a visitor a working product is unavailable.

**Famlistry exists and is not on the site at all.** famlistry.com is live with an open waitlist, and
Rogue Oak has nothing pointing at it.

So the products section has a reason to exist again, and its current copy is wrong.

**Who it's for:** anyone landing on rogueoak.com who wants to know what Rogue Oak actually makes,
not just the open-source tooling it builds with.

## Outcome

- **Products is reachable again**: a nav entry between Tools and Contact, and a card in the home
  pitch, so the home row is a pair again rather than a lone centred card.
- **`/products` lists two products**, each with a banner, a pitch, benefits, longer copy, a status,
  and a link out to the live product.
- **Both carry an `Alpha` badge.** Both are real and reachable today, and both are early. "Alpha" is
  the honest word for that, and it replaces "Coming soon" on Branch Out, which is no longer true.
- **Branch Out Games reads as shipped**: present tense, the games named, and a CTA that says
  `Play at branchout.games`.
- **Famlistry is new** at `/products/famlistry`, linking to famlistry.com, and honest that the app
  itself is still behind a waitlist.
- **No reference to Thought Buffer survives in shipped code.**

## Scope

### In

- `content.ts`: restore the `Products` nav entry and the home card; rewrite `productsPage.intro`;
  rewrite the Branch Out record; add the Famlistry record.
- `public/famlistry-logo.svg`: the Famlistry banner, in the shared 520x150 product-banner format.
  Generated in the famlistry repo from its seal (rogueoak/famlistry#26) and copied here, the same
  way every other product banner arrives.
- Tests: invert the two guards that asserted Products was _absent_, and pin the status to `Alpha`.
- `tests/structured-data.test.mjs`: replace the `Thought Buffer` fixture, the last mention of it in
  shipped code.
- `HomeIntro`: keep the count-driven layout working now that there are two cards again.
- Update spec 0011, which owns `/products`, so it stops describing a decommissioned product.

### Out

- **Any change to the product pages' structure.** `/products/[slug]`, the OG cards, the sitemap,
  `llms.txt`, and the structured data all read from `content.ts` and pick both products up with no
  code change. That is the design from 0011 working as intended, and this spec deliberately does not
  touch it.
- **A pricing or sign-up surface for either product.** Both link out; neither is sold from here.
- **Removing Thought Buffer from `docs/plans/`.** A plan is the record of how a change was built,
  and rewriting it would falsify that record. Only the living specs are corrected.

## Approach

### Status: `Alpha`, on both

The developer's call, and it resolves an asymmetry cleanly. Branch Out is playable; Famlistry is a
waitlist. Neither is finished, and both are real enough to show. `Alpha` says "early, and yours to
try" where "Coming soon" says "you cannot have this", which is now wrong for Branch Out and would
undersell Famlistry's open waitlist.

The honest detail lives in the body copy rather than the badge: Branch Out names the three games you
can play today, and Famlistry says plainly that the waitlist is what is open. A badge is a label, not
a substitute for saying what is true.

### The Famlistry banner comes from the famlistry repo

Every product banner on this site is a 520x150 SVG. Famlistry had only a square seal, so the banner
was **built in the famlistry repo** (rogueoak/famlistry#26), generated from the seal so it cannot
drift from the mark, and copied here as `public/famlistry-logo.svg`.

That direction matters: the brand asset belongs to the product, not to this site. Copying it in is
the same arrangement every other banner already has, and if the seal changes, the banner is
regenerated there and re-copied here.

The banner carries an opaque paper ground rather than being transparent. This site is hardcoded dark
(`<html className="dark">`), and the same file also has to render on GitHub in light mode, so a
transparent banner with ink text would be invisible in one of the two.

### Thought Buffer

Decommissioned in #36. What survived was a single test fixture using it as example data, which is
now `Famlistry`. Spec 0011 also still described `/products` as listing "Thought Stream and Branch
Out Games", so it is corrected in place: a spec that describes a retired product misleads every
agent that reads it as the source of truth. Spec 0010, whose whole feature (a "Coming soon" section
on the home page) was superseded by 0011, is marked superseded rather than rewritten.

## Acceptance

- [ ] `Products` appears in the nav between Tools and Contact, and as a home card.
- [ ] `/products` lists Branch Out Games and Famlistry, in that order.
- [ ] Both carry an `Alpha` badge; neither says "Coming soon".
- [ ] Branch Out's copy is present tense, names the playable games, and its CTA reads
      `Play at branchout.games`.
- [ ] `/products/famlistry` builds, renders the banner, and links to famlistry.com.
- [ ] The Famlistry OG card renders with the banner legible on the dark card.
- [ ] `public/famlistry-logo.svg` is the 520x150 banner generated in the famlistry repo.
- [ ] No shipped code references Thought Buffer or Thought Stream.
- [ ] Spec 0011 no longer describes Thought Stream as a listed product; spec 0010 is marked
      superseded.
- [ ] `npm test`, `npm run lint`, and `npm run build` all pass.
- [ ] Verified on the live site after deploy, not just locally.
