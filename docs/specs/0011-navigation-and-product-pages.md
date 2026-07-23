# 0011 - Navigation overhaul and dedicated tool/product pages

## Problem

rogueoak.com is a single scrolling page: hero, oak story, the three tools (Spectra, Trellis,
Canopy), a Coming Soon block, and a subscribe box, all stacked on `/`. There is nowhere to send
someone who wants to read about one tool, learn what the company is, see the product roadmap
(Thought Stream, Branch Out Games), or get in touch. The header is a bare wordmark with no
navigation.

Rogue Oak needs a real site: a top nav, a page per section, and a page per thing it makes, so the
home page can be a short pitch that routes visitors to the depth they want.

This is for a visitor who lands on rogueoak.com and asks one of: what is this, what do they make,
is X real yet, how do I reach them.

## Outcome

- A persistent **top navigation** on every page: the Rogue Oak brand mark (links home) plus
  **About**, **Tools**, **Products**, **Contact**. The current page's link is marked active. It
  collapses to a working mobile menu.
- **Home (`/`)** is a short sales pitch: what Rogue Oak is and why it exists, with clear routes
  into Tools and Products. The subscribe section stays at the foot of the page.
- **About (`/about`)** tells the mission and the oak name story. *Content is intentionally
  incomplete for this PR* (see Scope) and must be finished before go-live.
- **Tools (`/tools`)** is a listing of Spectra, Trellis, and Canopy (what the home page shows
  today), each linking to its own page.
  - **`/tools/spectra`, `/tools/trellis`, `/tools/canopy`** each get a dedicated page.
- **Products (`/products`)** lists two coming-soon products, Thought Stream and Branch Out Games,
  each linking to its own page.
  - **`/products/thought-stream`, `/products/branch-out`** each get a dedicated page. Branch Out
    Games uses its own logo (copied from the branchout repo).
- **Contact (`/contact`)** sends a Resend email to `contact@rogueoak.com`, using the same
  mechanism as matthewmaynes.com, with a branded HTML notification email. An optional, unticked
  "also subscribe to updates" box adds the sender to the Rogue Oak Constant Contact list.
- The dedicated `/subscribe` page and `/privacy` page are unchanged and still reachable.
- Every page carries its own `<title>` and meta description; `sitemap.ts` lists the new routes.

## Scope

**In**
- Upgrade `@rogueoak/canopy`, `@rogueoak/roots`, `@rogueoak/icons` from `0.x` to `^1.2.0`
  (additive release; ships the `TopNav` family this nav needs).
- New top-nav component built on Canopy `TopNav` / `TopNavBrand` / `TopNavLinks` / `TopNavLink` /
  `TopNavActions` / `TopNavMenuButton`, with active state driven by the current path.
- New routes and their content: `/about`, `/tools`, `/tools/{spectra,trellis,canopy}`,
  `/products`, `/products/{thought-stream,branch-out}`, `/contact`.
- Rework `/` into the pitch page; move the oak name story to `/about`; keep the subscribe section.
- Contact backend: `POST /v1/contact` (thin route), pure `src/lib/contact.ts` (validate, escape,
  render, Resend payload + send), a branded `emails/templates/contact-notification.html`, unit
  tests. Reuse the shared `src/lib/http-guards.ts` and the existing subscribe core for the opt-in.
- New env: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, documented in
  `.env.example`. The route fails closed (contact unavailable) when they are unset.
- **Deploy secret injection (revises spec 0005).** Stop hand-creating `deploy/docker/.env.site`
  on the box; the deploy job **generates it from GitHub Actions Secrets on every deploy**. All six
  runtime values move into GHA Secrets: `CTCT_CLIENT_ID`, `CTCT_REFRESH_TOKEN`, `CTCT_LIST_ID`,
  `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`. The new domain-verified Resend key
  serves both the contact form and the existing keepalive-alert cron (they read the same file), so
  it supersedes the old shared key. Update spec 0005, `deploy/README.md`, and the architecture doc.
- **Custom Open Graph preview per tool and per product.** Each of `/tools/{spectra,trellis,canopy}`
  and `/products/{thought-stream,branch-out}` gets its own content-matched OG image (Next.js
  route-level `opengraph-image`), so a shared link renders that item's wordmark + pitch, not the
  generic site card.
- Copy the Branch Out Games logo asset into `public/`.
- `sitemap.ts` lists every route (home, about, tools + 3 tool pages, products + 2 product pages,
  contact, subscribe, privacy).
- Centralize all new copy and the route/nav config in `src/lib/content.ts` (kept import-free).
- Update `docs/overview/` living docs.

**Out**
- Finished About-page mission copy (owner writes it before go-live; this PR ships the page shell
  with a clearly-marked placeholder, not lorem boilerplate).
- Provisioning the Resend secret. The owner mints a **new** Resend key, domain-verified for
  rogueoak.com, and places it in the host `.env.site` (and local `.env.local` for testing). This
  spec only names the vars and where they go.
- Any new server behavior beyond contact (no e-commerce, no auth, no CMS).
- Light theme / theme toggle (site stays dark-only).
- Making Branch Out Games or Thought Stream anything other than "coming soon".

## Approach

**Canopy upgrade (do first).** Bump the three `@rogueoak` packages to `^1.2.0`, `npm install`,
rebuild the brand (`npm run theme:build`) if the token pipeline moved, and confirm `lint`, `build`,
`test` stay green. The agent survey found 0.11 -> 1.2 is a feature-completion release, not a
breaking-API one: the `seeds`/`twigs`/`branches` export tiers, the token layer, and the
no-`"use client"` publishing model are all unchanged, so `globals.css` and the `ui.ts` barrel keep
working. Extend the `ui.ts` barrel to also export the `TopNav*` parts, `Textarea`, and `Checkbox`.

**Navigation.** A `SiteNav` client component (`"use client"` for `usePathname`) renders the Canopy
`TopNav` with the four links; the active link is the one whose route prefix matches the path
(`/tools/spectra` highlights Tools). Replace the current `Header` in `layout.tsx` with it. Nav
items come from a `nav` array in `content.ts` so the labels/paths live with the rest of the copy.

**Pages and content.** All page copy and the tool/product records live in `content.ts` (still
import-free, still the source of truth `site.ts` reads from). Model the data so a tool and a
product share one card/detail shape: `name`, `logo`, `pitch`, `benefits`, longer `body`
paragraph(s), `href`/`hrefLabel` (external repo/site), and for products a `status`
("Coming soon"). The three tool detail pages and two product detail pages render from a single
shared `ProductPage` component keyed by slug; the listing pages (`/tools`, `/products`) render the
existing card layout with an added "Learn more" link to the detail route. Home becomes a compact
pitch + two routing cards (Tools, Products) + the retained subscribe section.

**Contact.** Mirror matthewmaynes: a thin `POST /v1/contact` route over a pure `contact.ts`
(validate name/email/message, HTML-escape, render the notification template, build + send the
Resend payload via `fetch` to `https://api.resend.com/emails`, reply-to = sender). Reuse
`http-guards.ts` (honeypot, same-origin, per-IP rate limit, body cap) exactly as subscribe does.
When the opt-in box is ticked, also call the existing `submitSubscription` against the single Rogue
Oak list. `To` = `CONTACT_TO_EMAIL` (contact@rogueoak.com), `From` = `CONTACT_FROM_EMAIL` (a
verified rogueoak.com sender). Unset secrets => 500 "contact unavailable", never leak which.
Email-sending logic stays in the pure leaf so it is `node --test`-covered (per the learnings: no
security-relevant logic left inline in the route).

**Testing.** Unit tests for `contact.ts` (validation, escaping, template render with no injection,
subject sanitization, Resend payload shape, mocked send) mirroring matthewmaynes' `contact.test.ts`.
Existing subscribe/guards tests stay green. Manual: run the production build and screenshot every
new page (desktop + mobile) for the PR.

## Key decisions & trade-offs

- **One PR for the whole overhaul.** The nav, the pages, and the contact backend ship together
  because a nav that links to pages that do not exist is not shippable on its own. This is a
  deliberate exception to "one spec = smallest shippable slice": the smallest *coherent* slice here
  is the whole navigation model. The Canopy upgrade rides along as its prerequisite.
- **Home vs About split.** Home is the pitch (what/why, then route onward); About is the longer
  mission + the oak story. The oak story moves off the home page to About so home stays short.
- **Contact reuses the subscribe CTCT core**, so the opt-in box does not duplicate Constant Contact
  logic. rogueoak has a single list, so there is no separate "website contact" list like
  matthewmaynes.
- **New Resend key, not the branchout key.** The owner is minting a fresh key verified for
  rogueoak.com, so the `From` can be an on-brand rogueoak.com address and the two brands' keys stay
  independent. Nothing is read from the branchout host.
- **GHA becomes the single source of truth for host env; deploy regenerates `.env.site`.** The file
  is no longer hand-edited on the box. Consequence: if the CTCT refresh token ever dies and is
  re-minted (device flow, see deploy/README), the new token must be updated **in the GHA Secret**,
  not on the box, or the next deploy overwrites it. This diverges from the matthewmaynes-symmetric
  deploy (that box still hand-creates its file); the divergence is intentional and could be ported
  back later. Secrets reach the box without hitting the logs: the file is written via a quoted
  heredoc from masked env, `chmod 600`, never echoed.
- **Per-page OG images are generated, not static.** Route-level `opengraph-image` renders each
  tool/product card from the same `content.ts` record that drives the page, so the preview can never
  drift from the page copy.
- **About ships incomplete on purpose.** A visible placeholder beats fake mission copy; the page
  structure and route land now, the words land before go-live. PR stays open until the content gaps
  (About copy, home pitch sign-off, Resend key) are closed.

## Acceptance

- [ ] `@rogueoak/canopy`/`roots`/`icons` at `^1.2.0`; `npm run lint`, `build`, `test` all green.
- [ ] Top nav on every page with Brand + About/Tools/Products/Contact; active link reflects the
      current route; mobile menu opens and navigates.
- [ ] Routes resolve and are individually titled: `/`, `/about`, `/tools`, `/tools/spectra`,
      `/tools/trellis`, `/tools/canopy`, `/products`, `/products/thought-stream`,
      `/products/branch-out`, `/contact`. `/subscribe` and `/privacy` still work.
- [ ] Home is a pitch that links to `/tools` and `/products` and retains the subscribe section; the
      oak story now lives on `/about`.
- [ ] `/tools` and `/products` list their items, each linking to its detail page; Branch Out Games
      shows its own logo.
- [ ] `POST /v1/contact` sends a branded Resend email to `contact@rogueoak.com` with reply-to set
      to the sender; the opt-in box adds the sender to the Rogue Oak list; missing secrets fail
      closed. `contact.ts` is unit-tested.
- [ ] `.env.example` documents `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`.
- [ ] Deploy generates `deploy/docker/.env.site` from GHA Secrets (all six values), `chmod 600`,
      no secret in the logs; spec 0005, `deploy/README.md`, and the architecture doc reflect it.
      The six GHA Secrets are documented in `deploy/README.md`.
- [ ] Each tool and product page serves a custom, content-matched OG image; the root/listing pages
      keep a sensible default.
- [ ] `sitemap.ts` includes every route (home, about, tools + 3, products + 2, contact, subscribe,
      privacy); all copy follows `docs/rules/language.md` (ASCII, no spaced-dash breaks,
      third-person brand voice).
- [ ] PR is up with desktop + mobile screenshots of every new/changed page. **Not merged** until
      About copy is finished, the home pitch is signed off, and the Resend key is provisioned.
</content>
</invoke>
