import { serializeJsonLd } from "@/lib/structured-data";

/**
 * Renders JSON-LD structured data as a single <script type="application/ld+json">
 * tag (spec 0013). The schema objects come from `src/lib/structured-data.ts`; this
 * component only serializes them via `serializeJsonLd` (which carries the tested
 * script-breakout escape). Passing an array emits one script with a list of nodes,
 * the standard way to ship several schema.org objects for a page.
 */
export function JsonLd({ data }: { data: object | readonly object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
