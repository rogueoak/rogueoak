# 0007 - Privacy Policy

## Problem

Rogue Oak collects two kinds of visitor data: privacy-friendly PostHog analytics (already
shipped) and, with spec 0008, email addresses for a mailing list. There is no page that tells
visitors, in plain language, what happens to their data. A public site that collects an email
needs a privacy policy - it is the honest thing to do, and Constant Contact / app stores /
link-scanners increasingly expect one.

Audience: any visitor to rogueoak.com who wants to know what the site does with their data,
and anyone who wants to make a data request.

## Outcome

- A `/privacy` page renders a plain-language privacy policy in the Rogue Oak (dark) theme via
  the shared header/footer, with a visible "Last updated" date.
- It accurately describes the two data flows: PostHog analytics (cookieless, local-only in
  dev, masked session replays) and the Constant Contact mailing list (0008). It does **not**
  claim a contact form or Resend - Rogue Oak has neither.
- Privacy/data requests go to `privacy@rogueoak.com`.
- The page is linked from the site footer and listed in the sitemap so it is discoverable.

## Scope

**In:**
- `src/app/privacy/page.tsx` - the policy, adapted from matthewmaynes' spec 0017 page, trimmed
  to Rogue Oak's actual data flows (analytics + mailing list; no contact form / Resend).
- Footer link to `/privacy` (see 0008, which also adds the Subscribe link - shared footer edit).
- `/privacy` added to `sitemap.ts`.

**Out:**
- The mailing list itself (spec 0008). The policy's mailing-list section describes 0008's
  behavior; the two ship together as one cohesive change (privacy documents what subscribe does).
- A content-hash / change-detection guard (matthewmaynes has one; overkill for a single page here).

## Approach

- Static server component, same structure/classes as matthewmaynes' privacy page (sectioned,
  `max-w-3xl`, Canopy semantic text tokens), so it inherits the dark theme with no new styling.
- Trim to what is true here: **short version**, **analytics** (PostHog, cookieless, dev-off,
  masked replays, US processing, legitimate interest), **the mailing list** (Constant Contact,
  US processing, unsubscribe anytime), **IP addresses & server logs**, **what I do not collect**,
  **your choices and rights**, **children**, **changes**, **contact**. No contact-form section.
- `privacy@rogueoak.com` as the one published contact address (a `mailto:`), rendered only on
  this page.
- External processor links open in a new tab with `rel="noopener noreferrer"` (PostHog and
  Constant Contact privacy notices).

## Acceptance

- [ ] `/privacy` renders with the header/footer and a "Last updated" date.
- [ ] Copy is ASCII-only with spaced hyphens (guidelines) and names only real data flows.
- [ ] Footer links to `/privacy`; `/privacy` is in the sitemap.
- [ ] `npm run lint`, `npm run build`, and `npm test` pass.
