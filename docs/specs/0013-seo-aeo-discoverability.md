# 0013 - SEO / AEO discoverability: llms.txt, structured data, richer metadata

## Problem

rogueoak.com and thoughtbuffer.app already carry the SEO basics: a sitemap, a robots.txt, per-page
titles and descriptions, generated Open Graph cards, and a manifest. But two things that matter most
for how modern search engines and language models understand a site are missing entirely, and a few
per-page signals are thinner than they should be.

- There is **no `llms.txt`** on either domain. That file is the emerging convention for handing an
  LLM a clean, curated map of a site: what the company is, what it makes, and where to read more.
  Without it a model has to guess the shape of the site from raw HTML.
- There is **no structured data (JSON-LD)** anywhere. Search engines and answer engines read
  `Organization`, `WebSite`, `SoftwareApplication`, and `BreadcrumbList` schema to know what Rogue
  Oak is, what each tool and product is, and how the pages relate. Open Graph tags alone do not
  give them that.
- The tool and product detail pages set only `title` + `description`; they carry **no per-page
  Open Graph / Twitter block and no explicit canonical URL**, and neither do the section pages. The
  generated OG image is attached, but the canonical and social copy lean on defaults.

This is for the crawler or language model that lands on the site and asks: what is Rogue Oak, what
does it make, is each thing a tool or a product, and where is the authoritative page for it.

## Outcome

- **`llms.txt` on both domains.** `https://rogueoak.com/llms.txt` is a curated, link-first map:
  the brand and tagline, the mission, every tool and every product with its one-line pitch and
  canonical link, and pointers to the key pages (About, Tools, Products, Contact). It is generated
  from `content.ts` / `site.ts`, so a new tool or product appears in it automatically and it can
  never drift from the pages. `https://thoughtbuffer.app/llms.txt` is the Thought Buffer equivalent,
  hardcoded to that domain the same way its robots/sitemap already are.
- **JSON-LD across the site.** An `Organization` + `WebSite` graph on every rogueoak.com page; a
  `SoftwareApplication` + `BreadcrumbList` on each tool and product detail page; a
  `SoftwareApplication` (mobile app) + `Organization` publisher on the Thought Buffer landing. All
  built from the same `content.ts` records that drive the copy.
- **Richer per-page metadata.** Every tool/product detail page and every section page gets an
  explicit `alternates.canonical` and a per-page `openGraph` / `twitter` block (title + description
  from its own record). The home page gets an explicit canonical. Site-wide `keywords` and
  `category` are added in the `(main)` layout.
- **Sitemap polish.** Section and detail sitemap entries carry an `images` reference (the item
  wordmark or the site card) so image search and rich results have something to attach.
- The whole change is content-driven and covered by `node --test`: the `llms.txt` body and the
  JSON-LD objects are produced by pure, import-free functions with unit tests, mirroring how
  `content.ts` is already tested.

## Scope

**In**
- New pure builder `src/lib/llms.ts`: `renderLlmsTxt(doc)` turns a `{ title, summary, details[],
  sections[] }` document into the llms.txt text format. Import-free so `node --test` loads it.
- New route handlers: `src/app/llms.txt/route.ts` (rogueoak.com, built from `site.ts` + `content.ts`)
  and `src/app/thoughtbuffer/llms.txt/route.ts` (thoughtbuffer.app, built from `thought-buffer.ts` +
  the `thought-buffer` content record). Both served as `text/plain; charset=utf-8`.
- `proxy.ts`: add `/llms.txt` to the set of well-known files remapped onto the `/thoughtbuffer`
  subtree, exactly as `/robots.txt` and `/sitemap.xml` already are.
- New pure builders `src/lib/structured-data.ts`: `organizationSchema`, `websiteSchema`,
  `softwareApplicationSchema`, `breadcrumbSchema`. Import-free, unit-tested.
- New presentational component `src/components/json-ld.tsx`: renders a single
  `<script type="application/ld+json">` tag from a data object or array.
- Inject JSON-LD: Organization + WebSite in `(main)/layout.tsx`; SoftwareApplication + BreadcrumbList
  in the tool and product detail pages; SoftwareApplication + Organization on the Thought Buffer
  landing.
- Enrich metadata: `alternates.canonical` + per-page `openGraph`/`twitter` on tool/product detail
  pages (`generateMetadata`) and on the section pages (`about`, `tools`, `products`, `contact`,
  `subscribe`, `privacy`); explicit canonical on home; `keywords` + `category` in the `(main)`
  layout.
- `sitemap.ts`: add `images` to the section and detail entries.
- Unit tests: `tests/llms.test.mjs`, `tests/structured-data.test.mjs`.
- Update `docs/overview/` living docs (architecture: the two new well-known files and the JSON-LD
  seam; features: llms.txt + structured data).

**Out**
- Any change to page copy, layout, or visual design. This is metadata and machine-readable output
  only; nothing a human reader sees on the page changes.
- `llms-full.txt` (the full-body-copy variant). The curated `llms.txt` ships now; a full-text file
  can follow if it proves useful. Decided with the owner.
- New OG images or changes to the existing generated cards.
- hreflang / i18n (site is English-only), and any noindex changes to existing pages.
- Marking Thought Buffer or Branch Out Games as anything other than "coming soon".

## Approach

**llms.txt.** `renderLlmsTxt` is a pure function over a small document model (a title, a one-line
summary rendered as the `>` blockquote, optional detail paragraphs, then `##` sections each holding
`- [title](url): note` links) following the llmstxt.org convention. The rogueoak route handler
assembles that document from `site.ts` (name, tagline, description, url) and `content.ts` (the
`mission`, the `tools` and `products` arrays, the section pages), so the file is always in step with
the site. The thoughtbuffer handler assembles a smaller document from `thought-buffer.ts` and the
`thought-buffer` product record. Both live as route handlers (not the metadata-file convention) for
the same reason the thoughtbuffer robots/sitemap do: they must sit where `proxy.ts` can remap them
per host. Adding `/llms.txt` to the proxy's well-known list is a one-line change; the matcher already
lets `.txt` paths through (it only excludes image/font/manifest extensions).

**Structured data.** Four small pure builders return plain JSON-LD objects. `organizationSchema` and
`websiteSchema` describe Rogue Oak once, with a stable `@id` the other nodes reference.
`softwareApplicationSchema` maps one `content.ts` `Item` to a `SoftwareApplication` (tools use
`DeveloperApplication`; products use their natural category), with the publisher pointing back at the
Organization `@id`. `breadcrumbSchema` builds the Home > Tools > Spectra trail. A tiny `JsonLd`
component serializes a node (or array of nodes) into a script tag via `dangerouslySetInnerHTML`, the
standard Next.js App Router pattern. The Organization + WebSite graph renders once in the `(main)`
layout so it is present on every page; the per-item nodes render in the detail pages where the slug
is known. Thought Buffer gets its own SoftwareApplication (a mobile `iOS` app) plus the Organization
as publisher.

**Metadata.** The detail pages' `generateMetadata` gains `alternates.canonical` (the item's own
path) and an `openGraph` / `twitter` block carrying the item name + pitch; the generated
`opengraph-image` continues to attach automatically, so no image URLs are hand-wired. Section pages
gain an explicit canonical alongside their existing title/description, and home gains a `/` canonical.
`keywords` and `category` are set once in the `(main)` layout.

**Testing.** `renderLlmsTxt` is asserted on: the blockquote and section structure, that every tool
and product name and link is present, and that the output is ASCII-only with no spaced-dash breaks
(the language rules). The schema builders are asserted for `@type`, required fields, the publisher
`@id` linkage, and the breadcrumb ordering. Existing tests stay green; `lint`, `build`, `test` all
pass before the PR. Manual check: fetch `/llms.txt` on both hosts in the dev build and view-source a
detail page to confirm the JSON-LD renders.

## Key decisions & trade-offs

- **Generated, not static, llms.txt.** A route handler built from `content.ts` cannot drift from the
  pages the way a hand-maintained `public/llms.txt` would. Same reasoning the sitemap already
  follows. Cost: it is a server route, not a flat file, but the app is already a running server.
- **Curated `llms.txt`, no `llms-full.txt` yet.** The curated map is the high-value, low-maintenance
  artifact and matches the convention most tools read today. A full-text dump doubles the surface to
  keep honest for little proven gain; deferred rather than dropped.
- **JSON-LD via a pure builder + thin component.** Keeping the schema shapes in import-free functions
  makes them unit-testable without a DOM, consistent with how the rest of this codebase isolates
  logic from rendering. The component only serializes.
- **Organization graph in the layout, item nodes in the page.** The site-wide identity renders once
  where it belongs; the per-item schema renders where the slug is in scope, so nothing has to be
  threaded through props.
- **Products marked SoftwareApplication despite "coming soon".** Schema describes what the thing is,
  not whether it has shipped; the honest "coming soon" status stays in the visible copy. No fake
  availability or price is asserted.
- **No visible change.** Everything here is in the `<head>`, in a script tag, or at a well-known
  path. If a human notices a difference on the rendered page, something is wrong.

## Acceptance

- [ ] `https://rogueoak.com/llms.txt` returns `text/plain` with the brand, tagline, mission, every
      tool and product (name, pitch, canonical link), and the key page links; a new `content.ts`
      item would appear automatically.
- [ ] `https://thoughtbuffer.app/llms.txt` returns the Thought Buffer map, hardcoded to that domain;
      `proxy.ts` remaps it and the rogueoak internal prefix stays private.
- [ ] Every rogueoak.com page carries `Organization` + `WebSite` JSON-LD; each tool/product detail
      page carries `SoftwareApplication` + `BreadcrumbList`; the Thought Buffer landing carries
      `SoftwareApplication` + `Organization`. All validate as well-formed JSON-LD.
- [ ] Tool/product detail pages and section pages set an explicit `alternates.canonical` and a
      per-page `openGraph`/`twitter` block; home sets a `/` canonical; the `(main)` layout sets
      `keywords` + `category`.
- [ ] `sitemap.ts` entries carry `images`; the sitemap still lists every route.
- [ ] `tests/llms.test.mjs` and `tests/structured-data.test.mjs` cover the builders; `npm run lint`,
      `build`, and `test` are all green.
- [ ] No visible change to any rendered page; all copy follows `docs/rules/language.md` (ASCII, no
      spaced-dash breaks, third-person brand voice).
- [ ] `docs/overview/` architecture + features docs updated; PR is up.
