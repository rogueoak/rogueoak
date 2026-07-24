# Features

- **Multi-page site** (spec 0011): a dark-only site built on the Canopy design system (v1.2), with a
  persistent top nav (Canopy `TopNav`) linking About, Tools, Products, and Contact. The brand mark
  links home; the active section is highlighted; the nav collapses to a mobile menu.
  - **Home** (`/`): the pitch. Hero mark + tagline, the Rogue Oak mission up front, two cards
    routing to Tools and Products, then the "Subscribe for updates" section (spec 0008).
  - **About** (`/about`): leads with the Rogue Oak mission (the same statement the home page
    pitches, so the two never drift), then the oak name story rendered as a quote.
  - **Tools** (`/tools`): a listing of Spectra, Trellis, and Canopy, each a wordmark + pitch +
    benefits linking to its own page. Each tool has a **detail page** (`/tools/<slug>`) with longer
    copy and a repo link.
  - **Products** (`/products`): a listing of Thought Stream and Branch Out Games, both marked
    "Coming soon", each linking to its own **detail page** (`/products/<slug>`). Branch Out Games
    uses its own logo (vendored from the branchout repo).
  - Every tool and product page carries its own title, description, and a **custom Open Graph card**
    (generated from the same content record, so the share preview matches the page).
  - Sections fade/rise in on load (pure CSS).
  - Footer: Subscribe + Privacy links, GitHub org, matthewmaynes.com (its favicon as the icon), and
    "built with Canopy" linking to the Canopy repo.
- **Contact** (`/contact`, spec 0011): a form that sends an on-brand HTML notification email to the
  Rogue Oak inbox via Resend (reply-to the sender), mirroring matthewmaynes. An optional, unticked
  "subscribe" box also adds the sender to the "Rogue Oak" Constant Contact list. Honeypot,
  same-origin, per-IP rate limit, and a body cap guard the public endpoint; PII-free analytics.
  Secrets are server-only; unset => the route fails closed.
- **Subscribe** (spec 0008): a mailing list backed by the "Rogue Oak" Constant Contact list.
  - A dedicated `/subscribe` page (email + optional name, plus a taste of the three tools) and the
    same form at the foot of the home page.
  - `POST /v1/subscribe` adds the contact via Constant Contact `sign_up_form` (opt-in); the OAuth
    credentials live only in server env and never reach the browser.
  - An `@rogueoak.com` email is a test address: the form shows the real success state but the route
    never calls Constant Contact.
  - Mobile-first form (progressive optional-name reveal, honeypot, per-IP rate limit, PII-free
    analytics) with a success card that points to the welcome email.
  - A branded, mobile-friendly welcome email at `emails/templates/welcome.html`, created in Constant
    Contact as "Rogue Oak Welcome Template".
  - Announcement emails live in `emails/announcements/`; `thought-stream.html` announces the coming
    Thought Stream app to the Rogue Oak list (spec 0010).
- **Privacy policy** (`/privacy`, spec 0007): plain-language policy covering the two real data flows
  (analytics + mailing list); linked with Subscribe from the footer.
- **Analytics**: PostHog (client only), gated so only a deployed, non-local production build reports.
- **SEO / sharing**: metadata, `sitemap.ts`, `robots.ts`, an OpenGraph image, web manifest, icon.
