import { hero } from "@/lib/content";

/**
 * Site-wide constants: identity, canonical URL, and social links. One source of
 * truth so metadata, sitemap, robots, manifest, and the footer never drift. The
 * brand name and tagline come from `content.ts` (the import-free copy leaf) so
 * the page hero and the site metadata can never disagree. No secrets live here
 * by design.
 */
export const site = {
  name: hero.name,
  title: hero.tagline,
  // One shared description: the <meta>, Open Graph, and manifest all read this
  // so the link preview, search snippet, and install prompt never drift.
  description:
    "Rogue Oak builds developer tools that stand on their own. Spectra for spec-driven development, Trellis for shared agent conventions, and Canopy, a tree-themed design system.",
  // Alt text for the generated share card (opengraph-image).
  ogImageAlt: "Rogue Oak - Quietly rogue. Seriously solid.",
  // Read at build time for static metadata (metadataBase). Use `||` (not `??`)
  // so an empty-string SITE_URL falls back instead of throwing in new URL("").
  url: process.env.SITE_URL || "https://rogueoak.com",
  githubOrg: "https://github.com/rogueoak",
} as const;
