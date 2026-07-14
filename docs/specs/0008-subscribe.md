# 0008 - Subscribe to updates

## Problem

Rogue Oak has no way for a visitor to hear when something ships. We want a mailing list: a
visitor can leave their email and get the occasional update, stored in the "Rogue Oak" list in
Constant Contact - the same account and mechanism matthewmaynes.com uses (spec 0018), so one
setup serves both cohosted sites.

Audience: visitors who want to follow Rogue Oak; and the maintainer, who wants signups landing
in Constant Contact without exposing OAuth credentials to the browser.

## Outcome

- A dedicated `/subscribe` page (shared header/footer, dark theme) leads with the ask and an
  email + optional name form.
- A "Subscribe for updates" section renders at the bottom of the home page, below the projects.
- Submitting posts to `POST /v1/subscribe`, which adds the contact to the **Rogue Oak** list
  (`list_id 630fc3a0-7eda-11f1-9567-02420a320002`) via Constant Contact's `sign_up_form`
  (opt-in). Credentials live only in server env; nothing secret reaches the client.
- An email ending in `@rogueoak.com` is a **test address**: the form shows the identical success
  state but the route never writes to Constant Contact and never fires a welcome email - so the
  full UX can be exercised without creating throwaway contacts.
- The form reflects submitting / success / error; a success replaces the fields with a
  confirmation card that points the subscriber to the welcome email.
- Footer links to `/subscribe`; both `/subscribe` and `/privacy` (0007) are in the sitemap.
- A branded, mobile-friendly welcome email lives at `emails/templates/welcome.html` and is
  created in Constant Contact as the campaign **"Rogue Oak Welcome Template"**.

## Scope

**In:**
- `src/lib/subscribe.ts` - pure, import-free (node-testable leaf) core: validate/normalize,
  `isTestEmail` (`@rogueoak.com`), name split, `sign_up_form` payload, OAuth refresh + token
  cache with 401 self-heal, `submitSubscription`. Trimmed vs matthewmaynes: **no** unsubscribed
  "Website Contact" CRM path (Rogue Oak has no contact form).
- `src/lib/http-guards.ts` - generic honeypot / same-origin / in-memory rate limiter (copied
  from matthewmaynes; import-free).
- `src/app/v1/subscribe/route.ts` - thin HTTP shell: same-origin, body cap, honeypot, validate,
  test-domain short-circuit, per-IP rate limit, read `CTCT_*` env, submit. Fails closed if env
  is unset.
- `src/components/subscribe-form.tsx` - `"use client"` island: email + progressively-revealed
  optional name + honeypot, POSTs to `/v1/subscribe`, success card, PII-free PostHog events
  (`subscribe_submitted` / `_succeeded` / `_failed` with a `source` dimension, never the email).
- `src/app/subscribe/page.tsx` - the dedicated page (Rogue Oak copy; no blog "latest post").
- `src/components/subscribe.tsx` - the home-page section (heading + form), added to `page.tsx`
  after `<Projects />`, with the same `Reveal` treatment.
- `src/components/ui.ts` - re-export `Input` (seeds) and `FormField` / `FormFieldControl` /
  `FormFieldLabel` (twigs) across the client boundary.
- `src/components/site-footer.tsx` - add `/subscribe` and `/privacy` (0007) links.
- `src/app/sitemap.ts` - add `/subscribe` and `/privacy`.
- `emails/templates/welcome.html` + `emails/README.md` - the dark-themed welcome email and its
  publish notes.
- `.env.example` - document `CTCT_CLIENT_ID`, `CTCT_REFRESH_TOKEN`, `CTCT_LIST_ID`.
- `deploy/docker/compose.site.yml` + `deploy/README.md` - inject the three secrets via a host-side
  `deploy/docker/.env.site` (git-ignored, chmod 600), mirroring matthewmaynes; document creating it.
- `tests/subscribe.test.mjs` - unit tests for the pure core (validation, test-domain, name split,
  payload, token cache) and `tests/http-guards.test.mjs` for the guards.

**Out:**
- Contact form / Resend / "Website Contact" list (matthewmaynes-only).
- Sending or scheduling the welcome email (the template + campaign are created; the maintainer
  verifies the `hello@rogueoak.com` sender and sends).
- Double opt-in confirmation flow (Constant Contact handles list compliance / unsubscribe).

## Approach

- **Mirror matthewmaynes spec 0018**, trimmed to Rogue Oak: one list, opt-in only, no CRM record.
  `src/lib/subscribe.ts` and `src/lib/http-guards.ts` stay import-free leaves so `node --test`
  loads them directly (learnings: node-testable modules avoid path aliases).
- **Secrets never reach the client**: the OAuth client id, refresh token, and Rogue Oak list id
  are read from server env in the route only. Missing env => the route fails closed with a generic
  500; the page still renders. This is the site's first server-side secret, so the deploy grows a
  host-side `.env.site` (untracked) referenced by `env_file` - the same pattern the cohosted
  matthewmaynes stack already uses on this host.
- **Test domain** `@rogueoak.com`: `isTestEmail` short-circuits in the route *before* the rate
  limiter and any env/network, returning the same `{ ok: true }` so the client shows the real
  success state without touching Constant Contact.
- **Form**: Canopy `Input` + `FormField`, mobile-first (stacked below `sm`, inline at `sm+`),
  progressive name reveal, honeypot, `ph-no-capture` so an email never enters a session replay.
  Analytics gated by `clientAnalyticsEnabled()` (local runs never hit the live dashboard).
- **Welcome email**: a standalone, table-based, Outlook-hardened, mobile-responsive HTML email in
  the **Rogue Oak dark theme** (navy `#0a0d13` page, raised navy card, mist text, green `#5fb98a`
  button, gold `#d2a463` eyebrow). Header band = the Rogue Oak avatar (absolute
  `https://rogueoak.com/rogueoak-avatar.png`) + wordmark. Footer = text links (rogueoak.com,
  github.com/rogueoak) rather than hosted icon PNGs (none exist yet), so no image can 404.
  `[[FIRSTNAME OR "there"]]` personalization; CTA -> rogueoak.com. Created as a custom-code
  (`format_type 5`) campaign named "Rogue Oak Welcome Template" via
  `ctct email create ... --from-email hello@rogueoak.com --from-name "Rogue Oak"`.

## Acceptance

- [ ] `/subscribe` and the home-page section render the form; footer links to both `/subscribe`
      and `/privacy`; sitemap lists both.
- [ ] A normal email posts to `/v1/subscribe` and (with env set) lands on the Rogue Oak list; the
      success card shows.
- [ ] An `@rogueoak.com` email shows success but makes no Constant Contact call.
- [ ] No secret is present in any client bundle or committed file; unset env fails closed.
- [ ] `emails/templates/welcome.html` renders on brand and mobile-friendly; the "Rogue Oak Welcome
      Template" campaign exists in Constant Contact.
- [ ] `npm run lint`, `npm run build`, and `npm test` (new subscribe + guards tests) pass.
