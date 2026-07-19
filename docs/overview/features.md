# Features

- **One-page site** (`/`): a dark-only landing page built on the Canopy design system.
  - Hero: the Rogue Oak mark + name with the tagline "Software built to last."
  - The oak name story, rendered as a quote, tying the oak's longevity to a focus on value,
    experience, and quality.
  - A single-column showcase of Spectra, Trellis, and Canopy - each a large product wordmark, its
    pitch, benefits, and a repo link.
  - A "Coming soon" section (spec 0010) previews unshipped work - Thought Stream first, shown as a
    rounded app-icon tile with an "In early development" badge and a GitHub link.
  - A "Subscribe for updates" section closes the page (spec 0008), below Coming soon.
  - Footer: Subscribe + Privacy links, GitHub org, matthewmaynes.com (its favicon as the icon), and
    "built with Canopy" linking to the Canopy repo.
  - Sections fade/rise in on load (pure CSS).
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
