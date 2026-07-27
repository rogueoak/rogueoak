/**
 * Renders JSON-LD structured data as a single <script type="application/ld+json">
 * tag (spec 0013). The schema objects come from `src/lib/structured-data.ts`; this
 * component only serializes them. Passing an array emits one script with a list of
 * nodes, which is the standard way to ship several schema.org objects for a page.
 *
 * `dangerouslySetInnerHTML` is the App Router convention for JSON-LD: the payload
 * is our own `JSON.stringify` output (never user input), and the `<` escape guards
 * the one sequence that could break out of the script element.
 */
export function JsonLd({ data }: { data: object | readonly object[] }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
