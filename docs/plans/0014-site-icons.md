# 0014 - Site icon set: build plan

Source: `docs/specs/0014-site-icons.md`.

## Steps

1. **Reframe the icon source.** `src/app/icon.svg`: wrap the glow circle, the branch group, and
   the node group in one `<g transform="translate(256,254) scale(1.35) translate(-256,-254)">`.
   The background `<rect>` and the `<defs>` stay outside the group. Verify no element crosses the
   512 frame.

2. **Add `sharp` as a devDependency.** `npm i -D sharp` in the worktree. Confirm `package.json`
   and `package-lock.json` both move.

3. **Write `src/lib/icons.ts`.** Import-free leaf (no `@/` aliases, no extensionless relative
   imports) so `node --test` can load it directly. Exports:
   - `manifestIcons` - the array `manifest.ts` renders, each `{ src, sizes, type, purpose }`.
   - `rasterIcons` - every generated raster with its source SVG, output path, and pixel size.
     The generator and the test both read this, so the inventory has one home.

4. **Write `scripts/build-icons.mjs`.** Reads `rasterIcons`, renders each entry from its source SVG
   with `sharp` at high density, writes the PNGs. Then builds `src/app/favicon.ico` from the 16,
   32, and 48 renders with an inline ICO encoder: 6-byte `ICONDIR`, one 16-byte `ICONDIRENTRY` per
   image (width/height byte 0 means 256), PNG payloads appended. Wire as `"icons:build"` in
   `package.json` scripts.

5. **Generate the icons.** Run `npm run icons:build`. Outputs:
   `src/app/favicon.ico`, `src/app/apple-icon.png` (180), `public/icons/icon-192.png`,
   `public/icons/icon-512.png`, `public/icons/icon-maskable-512.png` (from
   `public/rogueoak-avatar.svg`).

6. **Update `src/app/manifest.ts`.** Read `manifestIcons` from the leaf. The
   `/rogueoak-avatar.png` entry goes away. Leave `public/rogueoak-avatar.{svg,png}` untouched on
   disk: `emails/templates/` hard-links the PNG by URL.

7. **Write `tests/icons.test.mjs`.** Pure `fs` header parsing, no new dependency:
   - PNG: bytes 16-24 of the file are `IHDR` width and height, big-endian uint32.
   - ICO: `ICONDIR` reserved 0, type 1, count 3; each entry's declared width/height.
   - Every `manifestIcons` entry resolves under `public/` or is a Next file-convention route, and
     its declared `sizes` matches the real pixels.

8. **Verify.** `npm run lint`, `npm test`, `npm run build`. Then run the production build
   (`node .next/standalone/server.js`, per the learning about dev-over-LAN) and confirm in the
   served HTML: an `apple-touch-icon` link, an `icon` link, a `manifest` link; and that
   `/favicon.ico`, `/apple-icon.png`, and `/manifest.webmanifest` all return 200 with the right
   content types. Eyeball the 16px raster.

9. **Reflect.** Update `docs/overview/features.md` (the icon set) and `docs/overview/architecture.md`
   (the generator, the icon leaf, the commit-the-bytes decision).

10. **Commit, push, PR.** Persona review per `docs/spectra/personas/`.

## Files touched

- `src/app/icon.svg` (reframed)
- `src/app/favicon.ico`, `src/app/apple-icon.png` (new, binary)
- `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (new, binary)
- `src/lib/icons.ts` (new)
- `scripts/build-icons.mjs` (new)
- `src/app/manifest.ts` (reads the leaf)
- `tests/icons.test.mjs` (new)
- `package.json`, `package-lock.json` (sharp, `icons:build`)
- `docs/overview/features.md`, `docs/overview/architecture.md`

## Verification

`lint` + `test` + `build` green; `/favicon.ico`, `/apple-icon.png`, `/manifest.webmanifest` all
200 from the standalone server; icon links present in the served HTML; `git diff --stat` shows
`public/rogueoak-avatar.svg` and `public/rogueoak-avatar.png` untouched.
