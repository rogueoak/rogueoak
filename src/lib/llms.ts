/**
 * The llms.txt renderer (spec 0013). Turns a small document model into the
 * llmstxt.org text format: an `# H1` title, a `>` blockquote summary, optional
 * detail paragraphs, then `##` sections of `- [title](url): note` links. A
 * language model reads this file for a clean, link-first map of the site instead
 * of guessing the shape from raw HTML.
 *
 * This module is import-free on purpose, exactly like `content.ts`: `node --test`
 * loads it directly to assert on the output, so it must not pull in path-aliased
 * or extensionless modules. The route handlers (app/llms.txt and
 * app/thoughtbuffer/llms.txt) assemble the document from `content.ts` / `site.ts`
 * / `thought-buffer.ts` and hand it here, so the file can never drift from the
 * pages. Keep the copy ASCII-only with no spaced-dash sentence breaks, per
 * docs/rules/language.md.
 */

/** One link line under a section: `- [title](url): note`. The note is optional. */
export type LlmsLink = {
  title: string;
  url: string;
  note?: string;
};

/** A `##` section: a heading and its links. */
export type LlmsSection = {
  title: string;
  links: readonly LlmsLink[];
};

/** The whole document a single llms.txt file renders from. */
export type LlmsDoc = {
  /** The `# H1` title, e.g. "Rogue Oak". */
  title: string;
  /** The `>` blockquote one-liner directly under the title. */
  summary: string;
  /** Optional paragraphs between the blockquote and the first section. */
  details?: readonly string[];
  /** The `##` sections, in order. */
  sections: readonly LlmsSection[];
};

/** Render one link line. A note is appended after a colon when present. */
function renderLink(link: LlmsLink): string {
  const base = `- [${link.title}](${link.url})`;
  return link.note ? `${base}: ${link.note}` : base;
}

/**
 * Render the document to the llms.txt text format. Blocks are separated by a
 * single blank line; the output ends with a trailing newline so the file reads
 * cleanly when curl'd or catted.
 */
export function renderLlmsTxt(doc: LlmsDoc): string {
  const blocks: string[] = [`# ${doc.title}`, `> ${doc.summary}`];

  for (const paragraph of doc.details ?? []) {
    blocks.push(paragraph);
  }

  for (const section of doc.sections) {
    const lines = [`## ${section.title}`, ...section.links.map(renderLink)];
    blocks.push(lines.join("\n"));
  }

  return blocks.join("\n\n") + "\n";
}
