// Static asset checks.
//
// Every SVG in public/ is served from this origin and is directly navigable, and `next/image`
// deliberately does not run SVG through the optimizer, so the file reaches a browser byte for byte.
// `nosniff` does not help here: an SVG document is allowed to contain script, and there is no CSP.
//
// Most of these files are vendored from another repo (the product banners), and the arrangement is
// to re-copy them whenever the source mark changes. That is a recurring, manual, easy-to-skim step
// with only a human eye between a foreign file and this origin, so the eye is replaced with a gate.
// Rasterising instead was considered and rejected: the site ships vectors on purpose.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { vendoredAssets, vendoredByFile } from "../src/lib/vendored.ts";
import { tools, products } from "../src/lib/content.ts";

const publicDir = fileURLToPath(new URL("../public", import.meta.url));
const appDir = fileURLToPath(new URL("../src/app", import.meta.url));

/** Every SVG this site serves, wherever it lives. */
function svgFiles() {
  const files = [];
  for (const [dir, label] of [
    [publicDir, "public"],
    [appDir, "src/app"],
  ]) {
    for (const name of readdirSync(dir)) {
      if (name.endsWith(".svg")) {
        files.push({
          name: `${label}/${name}`,
          body: readFileSync(`${dir}/${name}`, "utf8"),
        });
      }
    }
  }
  return files;
}

// Anything that can execute, phone out, or pull in another document. `href`/`xlink:href` is
// included because an `<a>` or an external reference inside a served SVG is a navigation target we
// did not write.
const FORBIDDEN = [
  [/<script[\s>]/i, "a <script> element"],
  [/<foreignObject[\s>]/i, "a <foreignObject> (arbitrary HTML)"],
  [/\son[a-z]+\s*=/i, "an inline event handler (on*=)"],
  [/javascript:/i, "a javascript: url"],
  [/<!ENTITY/i, "an ENTITY declaration (XXE)"],
  [/<!DOCTYPE/i, "a DOCTYPE"],
  [/<!\[CDATA\[/i, "a CDATA section"],
  [
    /(?:xlink:)?href\s*=\s*["'](?!#)/i,
    "an href to something other than a local fragment",
  ],
  [/url\(\s*["']?(?:https?:)?\/\//i, "a url() pointing off-origin"],
  [/<image[\s>]/i, "an <image> element (embeds another document)"],
];

/** Whether a "/foo.svg" public path exists on disk. */
function publicFileExists(publicPath) {
  return existsSync(`${publicDir}${publicPath}`);
}

const files = svgFiles();

test("there are SVGs to check (the sweep cannot pass vacuously)", () => {
  assert.ok(files.length >= 5, `expected several SVGs, found ${files.length}`);
});

for (const file of files) {
  test(`${file.name} carries nothing executable or off-origin`, () => {
    for (const [pattern, what] of FORBIDDEN) {
      assert.doesNotMatch(file.body, pattern, `${file.name} contains ${what}`);
    }
  });
}

// --- provenance -------------------------------------------------------------------------------
//
// Every banner here is a copy of a file owned by another repo, re-copied whenever that mark
// changes. Three of the five had already been edited on the way in with nothing recording it, so a
// deliberate adaptation and a stale copy looked identical. `src/lib/vendored.ts` records the
// source; these tests keep the record true.

test("every banner a page renders is recorded in the vendored manifest", () => {
  // Driven from the content records rather than a hardcoded list, so a new product cannot ship a
  // banner with no provenance.
  for (const item of [...tools, ...products]) {
    assert.ok(
      vendoredByFile(item.logo),
      `${item.name}'s banner ${item.logo} has no entry in src/lib/vendored.ts`,
    );
  }
});

test("the manifest describes files that exist, and no others", () => {
  for (const asset of vendoredAssets) {
    assert.ok(
      publicFileExists(asset.file),
      `manifest lists ${asset.file}, which is not in public/`,
    );
  }
});

test("each vendored file still hashes to what the manifest records", () => {
  // THE gate. Re-copying an updated banner changes the hash and fails here, which forces the
  // manifest entry to be updated at the one moment the new source commit is actually known. CI
  // cannot reach the other repos, so this is what makes the record keep up with reality.
  //
  // If this fails after a deliberate re-copy: update that entry's `commit`, `sha256`, and
  // `adaptations` to match what you brought across.
  for (const asset of vendoredAssets) {
    const body = readFileSync(`${publicDir}${asset.file}`);
    const actual = createHash("sha256").update(body).digest("hex");
    assert.equal(
      actual,
      asset.sha256,
      `${asset.file} changed without its manifest entry being updated`,
    );
  }
});

test("each manifest entry is well formed", () => {
  for (const asset of vendoredAssets) {
    assert.match(
      asset.repo,
      /^[\w.-]+\/[\w.-]+$/,
      `${asset.file}: repo is owner/name`,
    );
    assert.ok(
      asset.path.trim() && !asset.path.startsWith("/"),
      `${asset.file}: repo-relative path`,
    );
    assert.match(
      asset.commit,
      /^[0-9a-f]{40}$/,
      `${asset.file}: full source commit sha`,
    );
    assert.match(asset.sha256, /^[0-9a-f]{64}$/, `${asset.file}: sha256`);
    for (const reason of asset.adaptations) {
      // An adaptation has to say what and why. "tweaked" tells a future reader nothing, and the
      // whole point of the record is that a diff against the source reads as intentional.
      assert.ok(
        reason.length > 30,
        `${asset.file}: adaptation is not explained: ${reason}`,
      );
    }
  }
});

test("the manifest covers every SVG in public/, so none is silently unattributed", () => {
  // A first-party SVG is fine, it just has to be a deliberate absence rather than an oversight.
  const FIRST_PARTY = new Set([
    "/rogueoak-logo.svg",
    "/rogueoak-avatar.svg",
    "/branchout-icon.svg",
  ]);
  for (const name of readdirSync(publicDir)) {
    if (!name.endsWith(".svg")) continue;
    const file = `/${name}`;
    assert.ok(
      vendoredByFile(file) || FIRST_PARTY.has(file),
      `${file} is neither recorded as vendored nor listed as first-party`,
    );
  }
});

test("the vendored Famlistry banner is the shared 520x150 product-banner format", () => {
  // Three surfaces hardcode that geometry (the listing, the detail page, and the OG card, which
  // scales it to 572x165), and this is the first banner authored in another repo. A re-copy that
  // brought a different viewBox across would letterbox or crop with nothing to catch it.
  const banner = readFileSync(`${publicDir}/famlistry-logo.svg`, "utf8");
  assert.match(banner, /viewBox="0 0 520 150"/, "banner is 520x150");
});
