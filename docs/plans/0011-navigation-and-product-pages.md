# Plan 0011 - Navigation overhaul and dedicated tool/product pages

Source: `docs/specs/0011-navigation-and-product-pages.md`. Built in a worktree
(`.worktrees/0011-nav`, branch `0011-nav`), tested before commit, PR with screenshots, not merged
until the content gaps close.

## Step 0 - Worktree + Canopy upgrade

1. `git worktree add .worktrees/0011-nav -b 0011-nav`; `npm ci` **inside** the worktree
   (node_modules is git-ignored; never symlink - learnings).
2. Bump `@rogueoak/canopy`, `@rogueoak/roots`, `@rogueoak/icons` to `^1.2.0`; `npm install`.
3. `npm run theme:build` (regenerate the brand CSS in case the pipeline moved), then
   `npm run lint && npm run build && npm test` to confirm the upgrade is clean before any feature
   code. Verify: all green, no unstyled Canopy.

## Step 1 - Content model (`src/lib/content.ts`, import-free)

- Add a `nav` array: `{ label, href }` for About, Tools, Products, Contact.
- Reshape the tool/product records into one shared shape: `slug`, `name`, `logo`, `pitch`,
  `benefits[]`, `body[]` (1-2 longer paragraphs for the detail page), `href`, `hrefLabel`, and for
  products `status`. Keep the three tools (Spectra, Trellis, Canopy) and add the two products
  (Thought Stream from existing `comingSoon`, Branch Out Games new). Branch Out copy from the
  branchout repo: tagline "where game night grows", a party-game platform.
- Add `home` (pitch heading + subhead + the two routing-card blurbs), `about` (mission intro +
  keep the oak story here; mark the mission body as a visible placeholder to finish before
  go-live), `tools`/`products` listing intros, and `contact` copy.
- Unit-test the new copy in `tests/content.test.mjs` (ASCII-only, no " - " sentence breaks, every
  tool/product has the required fields, slugs unique).

## Step 2 - UI barrel + navigation

- Extend `src/components/ui.ts` to also re-export `TopNav, TopNavBrand, TopNavLinks, TopNavLink,
  TopNavActions, TopNavMenuButton` from `/branches` and `Textarea, Checkbox` from `/seeds`/`/twigs`.
- New `src/components/site-nav.tsx` (`"use client"` for `usePathname`): Canopy `TopNav` with the
  brand mark (links `/`) and the four links; active = route-prefix match (`/tools/x` -> Tools).
  Replace `Header` in `layout.tsx`. Delete `header.tsx`.
- Verify against a production build (`node .next/standalone/server.js`), not `next dev` - the
  mobile menu is client JS (learnings: dev-over-LAN hydration lies).

## Step 3 - Pages

- Shared `src/components/product-page.tsx` (server): wordmark, status badge (products), pitch,
  benefits, `body` paragraphs, outbound button. Reused by all 5 detail pages.
- Shared `src/components/product-list.tsx`: the current card layout + a "Learn more" link to the
  detail route. Used by `/tools` and `/products`.
- Routes: `/about`, `/tools` + `/tools/{spectra,trellis,canopy}`, `/products` +
  `/products/{thought-stream,branch-out}`, `/contact`. Rework `/` into the pitch (Hero pitch + two
  routing cards + retained `Subscribe`); move `NameStory` to `/about`.
- Each page exports `metadata` (title + description) from its `content.ts` record.

## Step 4 - Contact backend (mirror matthewmaynes, node-testable core)

- `src/lib/contact.ts` (import-free leaf): `validateContact`, `escapeHtml`,
  `renderContactNotification`, `buildResendPayload`, `sendViaResend(payload, apiKey, fetchImpl?)`.
- `src/app/v1/contact/route.ts`: thin shell - same-origin, body cap, honeypot, validate, rate
  limit (reuse `http-guards.ts`), read `RESEND_API_KEY`/`CONTACT_TO_EMAIL`/`CONTACT_FROM_EMAIL`
  (fail closed), render + send, and when the opt-in box is ticked call the existing
  `submitSubscription` against the single Rogue Oak list.
- `emails/templates/contact-notification.html`: Rogue Oak-branded, `[[NAME]]/[[EMAIL]]/[[MESSAGE]]/
  [[DATE]]` placeholders, dark-mode-safe (adapt matthewmaynes' template).
- `src/components/contact-form.tsx` (`"use client"` island): name/email/message + honeypot +
  optional unticked subscribe box; posts JSON to `/v1/contact`; PII-free analytics.
- `tests/contact.test.mjs`: validation, escaping, template render (no injection), subject
  sanitization, Resend payload shape, mocked send.
- `.env.example`: document the three contact vars (server-only, prod via host `.env.site`).

## Step 5 - OG images + sitemap

- Route-level `opengraph-image.tsx` for each of the 5 tool/product pages, rendering that record's
  wordmark + pitch via `ImageResponse` (shared helper so they stay consistent). Root/listing pages
  keep the existing default OG.
- `sitemap.ts`: add every route.

## Step 6 - Assets

- Copy `branchout-logo.svg` (and icon if useful) from the branchout repo into `public/` (repo is
  standalone; vendored at author time).

## Step 7 - Deploy: generate `.env.site` from GHA Secrets (revises spec 0005)

- `.github/workflows/release.yml` deploy job: before the rollout, write
  `deploy/docker/.env.site` on the box from six masked env values passed from GHA Secrets
  (`CTCT_CLIENT_ID`, `CTCT_REFRESH_TOKEN`, `CTCT_LIST_ID`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`,
  `CONTACT_FROM_EMAIL`) via a quoted heredoc, `chmod 600`, never echoed (no `set -x`; base64 the
  blob over stdin so no secret lands in argv/logs).
- Update `deploy/README.md` (drop "create once by hand" -> "generated each deploy from GHA
  Secrets"; document the six Secrets; note the re-mint-in-GHA rule), spec `0005-deploy.md`, and
  `docs/overview/architecture.md`.
- `compose.site.yml` keeps `env_file: .env.site required:false` (unchanged).

## Step 8 - Verify, screenshot, reflect

- `npm run lint && npm run build && npm test` green.
- Production build; Playwright screenshots (desktop + mobile) of every page for the PR. Contact:
  exercise the form; live-send only if a test key is in `.env.local`.
- Update `docs/overview/{features,architecture,project}.md`; add a learning only if the build
  surfaces one.

## Step 9 - PR + persona review

- Push, open PR with the screenshots. Personas whose facet the change touches: **engineer**
  (contact core, nav logic), **tester** (new behavior), **architect** (routes, deploy secret flow),
  **security** (contact input handling, secret injection on deploy, new deps). Address comments,
  re-test. **Do not merge** until About copy is finished, the home pitch is signed off, and the six
  GHA Secrets are set.
</content>
