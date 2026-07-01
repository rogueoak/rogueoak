/**
 * Site-wide constants: identity, canonical URL, and social links. One source of
 * truth so metadata, sitemap, robots, manifest, and the footer never drift. No
 * secrets live here by design.
 */
export const site = {
  name: "Rogue Oak",
  title: "Quietly rogue. Seriously solid.",
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
