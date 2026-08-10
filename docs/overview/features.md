# Features

- **Multi-page site** (spec 0011): a dark-only site built on the Canopy design system (v1.2), with a
  persistent top nav (Canopy `TopNav`) linking About, Tools, and Contact. The brand mark
  links home; the active section is highlighted; the nav collapses to a mobile menu.
  - **Home** (`/`): the pitch. Hero mark + tagline, the Rogue Oak mission up front, a card
    routing to Tools, then the "Subscribe for updates" section (spec 0008). The card row lays
    itself out from the card count, so one card centres and two split the row.
  - **About** (`/about`): leads with the Rogue Oak mission (the same statement the home page
    pitches, so the two never drift), then the oak name story rendered as a quote.
  - **Tools** (`/tools`): a listing of Spectra, Trellis, and Canopy, each a wordmark + pitch +
    benefits linking to its own page. Each tool has a **detail page** (`/tools/<slug>`) with longer
    copy and a repo link.
  - **Products** (`/products`): a listing of **Branch Out Games** and **Famlistry**, each marked
    `Alpha` and linking to its own **detail page** (`/products/<slug>`) and out to the live product.
    Each uses a banner vendored from the product's own repo, in the shared 520x150 format (the
    famlistry brand package composes a dark-ground variant specifically for this page, so the two
    products read as a matched pair). Branch
    Out is playable (three games); Famlistry is a waitlist, and the copy says so rather than leaning
    on the badge to carry it. Linked from both the nav and the home pitch (spec 0015). It was
    unlinked for a while under #38, when the one product listed was not ready to advertise; the
    pages kept building throughout, which is why bringing it back was a data edit.
  - Every tool and product page carries its own title, description, and a **custom Open Graph card**
    (generated from the same content record, so the share preview matches the page).
  - Sections fade/rise in on load (pure CSS).
  - Footer: Subscribe + Privacy links, GitHub org, matthewmaynes.com (its favicon as the icon), and
    "built with Canopy" linking to the Canopy repo.
- **Contact** (`/contact`, spec 0011): a form that sends an on-brand HTML notification email to the
  Rogue Oak inbox via Resend (reply-to the sender), mirroring matthewmaynes. An optional, unticked
  "subscribe" box also adds the sender to the "Rogue Oak" Constant Contact list. Same-origin,
  per-IP rate limit, and a body cap guard the public endpoint; PII-free analytics.
  Secrets are server-only; unset => the route fails closed.
- **Subscribe** (spec 0008): a mailing list backed by the "Rogue Oak" Constant Contact list.
  - A dedicated `/subscribe` page (email + optional name, plus a taste of the three tools) and the
    same form at the foot of the home page.
  - `POST /v1/subscribe` adds the contact via Constant Contact `sign_up_form` (opt-in); the OAuth
    credentials live only in server env and never reach the browser.
  - An `@rogueoak.com` email is a test address: the form shows the real success state but the route
    never calls Constant Contact.
  - Mobile-first form (progressive optional-name reveal, per-IP rate limit, PII-free
    analytics) with a success card that points to the welcome email.
  - A branded, mobile-friendly welcome email at `emails/templates/welcome.html`, created in Constant
    Contact as "Rogue Oak Welcome Template".
- **Privacy policy** (`/privacy`, spec 0007): plain-language policy covering the two real data flows
  (analytics + mailing list); linked with Subscribe from the footer.
- **Analytics**: PostHog (client only), gated so only a deployed, non-local production build reports.
- **SEO / sharing**: metadata, `sitemap.ts` (with image entries), `robots.ts`, an OpenGraph image,
  web manifest, icon. Every page sets an explicit canonical; detail pages carry per-page OG/Twitter.
- **Site icons** (spec 0014): a full set generated from the vector mark by `npm run icons:build` -
  `favicon.ico` (16/32/48), `apple-icon.png` (180) for Safari bookmarks and iOS home screens,
  `icon.svg` for tabs, and 192/512 plus a `maskable` 512 for the manifest. The tab mark is framed
  tighter than the GitHub avatar so it still reads at 16px.
- **AEO / machine discoverability** (spec 0013): a curated `llms.txt` (generated from `content.ts`, so
  it never drifts from the pages) and JSON-LD structured data across the site: `Organization` +
  `WebSite` site-wide, and `SoftwareApplication` + `BreadcrumbList` on each tool/product page.
