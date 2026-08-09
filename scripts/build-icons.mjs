/**
 * Rasterizes the site icon set from vector sources. Run with `npm run icons:build`.
 *
 * The outputs are committed to git rather than generated at build time: a reviewer sees them in
 * the PR diff, the container build needs no image toolchain, and a cold `next build` does no
 * rasterization. This script exists so regenerating after an art change is one command.
 *
 * The inventory lives in `src/lib/icons.ts`, which `manifest.ts` and `tests/icons.test.mjs` read
 * too, so the three can never disagree about what exists or how big it is.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { rasterIcons, faviconSizes, ICON_SVG, FAVICON_ICO } from "../src/lib/icons.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Both icon sources declare a 512-unit viewBox. Rendering at 4x the largest target and
 * downsampling with Lanczos antialiases the thin branch strokes far better than asking the SVG
 * rasterizer for a 16px bitmap directly, where they collapse to single hard pixels.
 */
const VIEWBOX = 512;
const SUPERSAMPLE = 2048;

/** Renders one square PNG at `size` from a repo-relative SVG path. */
async function renderSquare(source, size) {
  const base = await sharp(join(ROOT, source), {
    density: (72 * SUPERSAMPLE) / VIEWBOX,
  })
    .resize(SUPERSAMPLE, SUPERSAMPLE)
    .png()
    .toBuffer();

  return sharp(base)
    .resize(size, size, { kernel: "lanczos3" })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** Writes `data` to a repo-relative path, creating parent directories as needed. */
async function write(target, data) {
  const abs = join(ROOT, target);
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(abs, data);
  return abs;
}

/**
 * Packs PNGs into a multi-resolution ICO.
 *
 * The container is trivial: a 6-byte ICONDIR, then one 16-byte ICONDIRENTRY per image, then the
 * payloads. Storing PNG rather than BMP inside an ICO has been supported since Windows Vista and
 * is what every current browser reads, so this needs no BMP encoder and no dependency.
 */
function encodeIco(images) {
  const HEADER = 6;
  const ENTRY = 16;
  const header = Buffer.alloc(HEADER);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(images.length, 4);

  let offset = HEADER + ENTRY * images.length;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(ENTRY);
    // 0 encodes 256 in this field; every size here is smaller, but keep the rule honest.
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // palette entries, 0 for truecolor
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const written = [];

for (const { source, out, size } of rasterIcons) {
  await write(out, await renderSquare(source, size));
  written.push(`${out} (${size}x${size})`);
}

const faviconImages = [];
for (const size of faviconSizes) {
  faviconImages.push({ size, data: await renderSquare(ICON_SVG, size) });
}
await write(FAVICON_ICO, encodeIco(faviconImages));
written.push(`${FAVICON_ICO} (${faviconSizes.join(", ")})`);

console.log(`Wrote ${written.length} icons:`);
for (const line of written) console.log(`  ${line}`);
