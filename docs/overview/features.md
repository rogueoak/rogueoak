# Features

- **One-page site** (`/`): a dark-only landing page built on the Canopy design system.
  - Hero: the Rogue Oak mark + name with the tagline "Tools built to stand on their own."
  - The oak name story, rendered as a quote.
  - A single-column showcase of Spectra, Trellis, and Canopy - each a large product wordmark, its
    pitch, benefits, and a repo link.
  - Footer: GitHub org, matthewmaynes.com (its favicon as the icon), and "built with Canopy" linking
    to the Canopy repo.
  - Sections fade/rise in on load (pure CSS).
- **Analytics**: PostHog (client only), gated so only a deployed, non-local production build reports.
- **SEO / sharing**: metadata, `sitemap.ts`, `robots.ts`, an OpenGraph image, web manifest, icon.
