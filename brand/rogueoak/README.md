# Rogue Oak brand (Canopy)

The Rogue Oak site brand: the navy/green/amber banner palette re-pointed onto Canopy's semantic
tokens. The site is **dark-only**, so this brand overrides only the `.dark` theme and inherits
Canopy's light defaults (light mode is never shown).

Source DTCG token files, consumed by the `@rogueoak/roots` brand pipeline:

- `primitive.json` - the `navy` (surfaces/borders), `mist` (text), `green` (primary), and `gold`
  (accent) ramps.
- `semantic.json` - **empty**: Rogue Oak overrides nothing in light, so light inherits Canopy.
- `semantic.dark.json` - the Canopy semantic roles the brand overrides in dark. Roles omitted here
  (secondary, status) inherit Canopy's defaults by cascade.
- `brand.config.json` - wires the above into `roots-brand`.

## Regenerate

```bash
npm run theme:build
```

That compiles these sources into `src/styles/brand-rogueoak.generated.css` (a `:root` block of
brand primitives + a `.dark` block of the role overrides), imported after
`@rogueoak/roots/tokens.css` in `src/styles/globals.css`. Commit the regenerated CSS; do not
hand-edit it. `src/styles/theme-rogueoak.css` keeps only the non-palette `color-scheme: dark`.

The pipeline enforces **WCAG AA** on every overridden pair - including each override checked
against the Canopy default it lands next to - so the build fails if a combination is illegible.
