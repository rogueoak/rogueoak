/**
 * The site icon inventory: one list, read by everything that cares.
 *
 * `scripts/build-icons.mjs` renders `rasterIcons` and `faviconSizes`, `manifest.ts` renders
 * `manifestIcons`, and `tests/icons.test.mjs` asserts the bytes on disk match what is declared
 * here. Keeping the inventory in one place is the point: the bug this replaced was a manifest
 * that advertised a 1024x1024 file as 512x512, which nothing could catch.
 *
 * Import-free by design (no `@/` aliases, no extensionless relative imports) so `node --test`
 * can load it directly. Paths are repo-root-relative POSIX so the script and the test resolve
 * them the same way.
 */

/** A raster the generator produces from a vector source. */
export type RasterIcon = {
  /** Repo-root-relative path to the SVG to render. */
  readonly source: string;
  /** Repo-root-relative path to write. */
  readonly out: string;
  /** Square edge in pixels. */
  readonly size: number;
};

/** One entry in the web manifest's `icons` array, plus where its bytes live. */
export type ManifestIcon = {
  /** URL the manifest advertises. */
  readonly src: string;
  readonly sizes: string;
  readonly type: string;
  readonly purpose: "any" | "maskable";
  /** Repo-root-relative path backing `src`. Read by the test, not by the manifest. */
  readonly file: string;
};

/**
 * The tab/bookmark mark. Reframed in spec 0014 to fill the tile, so it survives being
 * rasterized to 16px.
 */
export const ICON_SVG = "src/app/icon.svg";

/**
 * The GitHub avatar framing. Its generous padding is exactly the safe zone a `maskable` icon
 * needs, so the maskable render comes from here rather than from the tightened mark. Also
 * hard-linked by URL from `emails/templates/`, so it does not move.
 */
export const AVATAR_SVG = "public/rogueoak-avatar.svg";

/** Sizes packed into the multi-resolution `favicon.ico`. */
export const faviconSizes = [16, 32, 48] as const;

/** Where the generator writes the ICO. Next's file convention serves it at `/favicon.ico`. */
export const FAVICON_ICO = "src/app/favicon.ico";

export const rasterIcons: readonly RasterIcon[] = [
  // Next's `apple-icon` file convention; emits <link rel="apple-touch-icon">. 180 is the size
  // current iOS asks for and downscales cleanly for every older device.
  { source: ICON_SVG, out: "src/app/apple-icon.png", size: 180 },
  // Manifest install icons. 192 and 512 are the pair Chrome's install prompt looks for.
  { source: ICON_SVG, out: "public/icons/icon-192.png", size: 192 },
  { source: ICON_SVG, out: "public/icons/icon-512.png", size: 512 },
  { source: AVATAR_SVG, out: "public/icons/icon-maskable-512.png", size: 512 },
] as const;

export const manifestIcons: readonly ManifestIcon[] = [
  { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any", file: ICON_SVG },
  {
    src: "/icons/icon-192.png",
    sizes: "192x192",
    type: "image/png",
    purpose: "any",
    file: "public/icons/icon-192.png",
  },
  {
    src: "/icons/icon-512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "any",
    file: "public/icons/icon-512.png",
  },
  {
    src: "/icons/icon-maskable-512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable",
    file: "public/icons/icon-maskable-512.png",
  },
] as const;
