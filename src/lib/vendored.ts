/**
 * Where each vendored brand asset came from.
 *
 * Every product and tool banner in `public/` is a copy of a file that lives in that product's own
 * repo. Nothing about that arrangement is wrong: the brand belongs to the product, and this site is
 * one of its consumers. What was missing is any record of it, and the cost showed up the moment
 * anyone looked. Three of the five copies had been edited on the way in, and because the edits were
 * not written down anywhere, a deliberate adaptation was indistinguishable from a file that had
 * quietly gone stale.
 *
 * So each copy records its source and, if it differs, exactly why. Two rules make the record hold:
 *
 * 1. `sha256` is the hash of the file as it exists HERE. `tests/assets.test.mjs` recomputes it, so
 *    re-copying an updated banner fails the suite until this entry is updated too. That is the
 *    point: the failure lands at the moment someone is re-vendoring, which is exactly when the new
 *    source commit is known and worth writing down.
 * 2. `adaptations` must be empty for a verbatim copy and must explain every difference otherwise.
 *    A future reader diffing this file against its source gets an answer rather than a mystery.
 *
 * The `commit` cannot be verified from here (CI has no access to the other repos), so it is a
 * record rather than a check. The hash is the enforced half.
 */

/** One brand asset copied in from the repo that owns it. */
export type VendoredAsset = {
  /** Public path as served, e.g. `/spectra-logo.svg`. */
  file: string;
  /** Source repository, `owner/name`. */
  repo: string;
  /** Path to the file within that repository. */
  path: string;
  /** The source commit this copy was taken from. A record, not a check. */
  commit: string;
  /**
   * Why this copy differs from its source. Empty means byte-for-byte identical. Each entry names a
   * change and the reason for it, so a diff against the source reads as intentional.
   */
  adaptations: readonly string[];
  /** sha256 of the file in `public/`, enforced by the test. */
  sha256: string;
};

/**
 * The knockout every banner authored for a dark card needs on this site. Those banners paint an
 * opaque `#0d1117` card so they read on their own repo's README; here the page already supplies
 * that ground, and a second opaque card inside it reads as a box around the wordmark.
 */
const CARD_KNOCKOUT =
  "card rect set to fill=none: the source paints an opaque #0d1117 card for its own README, which on this site's dark page reads as a box around the mark";

export const vendoredAssets: readonly VendoredAsset[] = [
  {
    file: "/branchout-logo.svg",
    repo: "rogueoak/branchout",
    path: "assets/branchout-logo.svg",
    commit: "df0d7ab3614b8d644467f7332e68d2851fc1fee4",
    adaptations: [],
    sha256: "7fc295fc1a523a125c4827131984bbf84c430dfbc0d14cab897b0c2da473f1e5",
  },
  {
    file: "/spectra-logo.svg",
    repo: "rogueoak/spectra",
    path: "assets/logo.svg",
    commit: "fa36678ae2df2ebe3bceb8c5b2e2c565d39940a4",
    adaptations: [CARD_KNOCKOUT],
    sha256: "096a456fa38465288827ae420003df32e3ac2cee6215c0a18ecf6f52edb8ff56",
  },
  {
    file: "/trellis-logo.svg",
    repo: "rogueoak/trellis",
    path: "assets/logo.svg",
    commit: "aa09e44eb49e870bc0926facaeb3775f7da8283f",
    adaptations: [CARD_KNOCKOUT],
    sha256: "8ecb05c04c5b89d5445338afb7c1b803086cc58373b6923fe1f1b80191b92520",
  },
  {
    file: "/canopy-logo.svg",
    repo: "rogueoak/canopy",
    path: "assets/logo.svg",
    commit: "64430cb7bedf30e6b620f02790362a50fbd14769",
    adaptations: [
      CARD_KNOCKOUT,
      "aria-label reads 'Canopy: the rogueoak design system' rather than 'Canopy - ...': language.md retires the spaced dash as a sentence break in favour of a colon, and this string is read aloud on this site",
    ],
    sha256: "aba9cb7355001326cebc3cd3000fc61a6ed7381bf7e7fd8c8b3ad52c7a351821",
  },
  {
    file: "/famlistry-logo.svg",
    repo: "rogueoak/famlistry",
    // The brand package composes the banner on two grounds. This site is hardcoded dark, so it
    // takes the dark one; `banner.svg` (paper) is what that repo's own README shows.
    path: "packages/brand/logo/banner-dark.svg",
    commit: "585056ea0886df503db83418dd6c6432fa7c1b7d",
    adaptations: [],
    sha256: "58aa4a8fe39dbc7484b09e5e05b93c6cf25f446e56373a3df8c7c68362376f70",
  },
];

/** Look up a vendored asset by its public path. */
export function vendoredByFile(file: string): VendoredAsset | undefined {
  return vendoredAssets.find((asset) => asset.file === file);
}
