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
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

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

test("the vendored Famlistry banner is the shared 520x150 product-banner format", () => {
  // Three surfaces hardcode that geometry (the listing, the detail page, and the OG card, which
  // scales it to 572x165), and this is the first banner authored in another repo. A re-copy that
  // brought a different viewBox across would letterbox or crop with nothing to catch it.
  const banner = readFileSync(`${publicDir}/famlistry-logo.svg`, "utf8");
  assert.match(banner, /viewBox="0 0 520 150"/, "banner is 520x150");
});
