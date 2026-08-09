// Asserts the site icon set on disk matches what src/lib/icons.ts declares.
//
// The bug this exists to catch: the manifest used to advertise a 1024x1024 file as "512x512",
// and nothing failed. Declared sizes are only worth having if something checks them, so these
// tests read the real bytes and parse the real headers. No image library needed for that.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  rasterIcons,
  manifestIcons,
  faviconSizes,
  ICON_SVG,
  FAVICON_ICO,
} from "../src/lib/icons.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(ROOT, rel));

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * Reads a PNG's real pixel dimensions from its IHDR chunk, which the spec pins to the first
 * chunk: 8-byte signature, 4-byte length, "IHDR", then width and height as big-endian uint32.
 */
function pngSize(buf) {
  assert.ok(buf.subarray(0, 8).equals(PNG_SIGNATURE), "not a PNG");
  assert.equal(buf.subarray(12, 16).toString("ascii"), "IHDR", "IHDR is not the first chunk");
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/** Reads the ICONDIR + ICONDIRENTRY table out of an ICO. */
function icoEntries(buf) {
  assert.equal(buf.readUInt16LE(0), 0, "ICONDIR reserved field must be 0");
  assert.equal(buf.readUInt16LE(2), 1, "ICONDIR type must be 1 (icon)");
  const count = buf.readUInt16LE(4);
  return Array.from({ length: count }, (_, i) => {
    const at = 6 + i * 16;
    return {
      // 0 encodes 256 in the ICO directory.
      width: buf.readUInt8(at) || 256,
      height: buf.readUInt8(at + 1) || 256,
      bytes: buf.readUInt32LE(at + 8),
      offset: buf.readUInt32LE(at + 12),
    };
  });
}

test("every generated raster exists at its declared size", () => {
  for (const { out, size } of rasterIcons) {
    assert.ok(existsSync(join(ROOT, out)), `${out} is missing; run npm run icons:build`);
    assert.deepEqual(pngSize(read(out)), { width: size, height: size }, `${out} is the wrong size`);
  }
});

test("favicon.ico packs every declared size as a PNG", () => {
  const buf = read(FAVICON_ICO);
  const entries = icoEntries(buf);

  assert.deepEqual(
    entries.map((e) => e.width),
    [...faviconSizes],
    "favicon.ico does not hold the declared sizes",
  );

  for (const entry of entries) {
    assert.equal(entry.width, entry.height, "favicon entries must be square");
    const payload = buf.subarray(entry.offset, entry.offset + entry.bytes);
    assert.deepEqual(
      pngSize(payload),
      { width: entry.width, height: entry.height },
      `favicon ${entry.width}px payload does not match its directory entry`,
    );
  }
});

test("every manifest icon resolves to a file of the size it advertises", () => {
  for (const { src, sizes, type, file } of manifestIcons) {
    assert.ok(existsSync(join(ROOT, file)), `${src} points at missing ${file}`);

    if (type === "image/svg+xml") {
      assert.equal(sizes, "any", `${src} is vector, so it should declare sizes "any"`);
      continue;
    }

    const [w, h] = sizes.split("x").map(Number);
    assert.deepEqual(pngSize(read(file)), { width: w, height: h }, `${src} lies about its size`);
  }
});

test("manifest URLs match where the bytes actually live", () => {
  for (const { src, file } of manifestIcons) {
    if (file.startsWith("public/")) {
      assert.equal(src, file.replace(/^public/, ""), `${src} does not map to ${file}`);
    } else {
      // Anything outside public/ is served by a Next file convention in src/app.
      assert.equal(src, `/${file.replace(/^src\/app\//, "")}`, `${src} does not map to ${file}`);
    }
  }
});

test("the manifest offers a maskable icon and no oversized avatar", () => {
  const maskable = manifestIcons.filter((i) => i.purpose === "maskable");
  assert.equal(maskable.length, 1, "expected exactly one maskable icon");
  assert.equal(maskable[0].sizes, "512x512");

  // Regression: the avatar PNG is 1024x1024 and was advertised as 512x512. It stays on disk for
  // the email templates that hard-link it, but it is not an install icon.
  assert.ok(
    !manifestIcons.some((i) => i.src.includes("rogueoak-avatar")),
    "the avatar PNG should not be a manifest icon",
  );
});

test("the tab icon is framed to survive a 16px render", () => {
  const svg = read(ICON_SVG).toString("utf8");
  const match = svg.match(/scale\(([\d.]+)\)/);
  assert.ok(match, "icon.svg should scale the mark within its frame");
  assert.ok(
    Number(match[1]) >= 1.3,
    "the mark is back to avatar framing and will be illegible as a favicon",
  );
});
