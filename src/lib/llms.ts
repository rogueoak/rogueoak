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

/** One tool/product as it appears in an llms.txt link (a `content.ts` Item subset). */
export type LlmsItem = {
  slug: string;
  name: string;
  pitch: string;
  status?: string;
};

/** One curated page link: its label, path under the site, and a one-line note. */
export type LlmsPage = {
  title: string;
  path: string;
  note: string;
};

/** Note for a tool/product link: the pitch, with an unshipped product's status appended. */
export function itemNote(item: Pick<LlmsItem, "pitch" | "status">): string {
  return item.status ? `${item.pitch} (${item.status})` : item.pitch;
}

/**
 * Assemble the rogueoak.com llms.txt document from the content model. Kept here
 * (not inline in the route handler) so the assembly - the summary join, the
 * product `(status)` suffix, the section shape - is unit-testable. `base` is the
 * site origin with no trailing slash (e.g. "https://rogueoak.com").
 */
export function buildSiteLlmsDoc(input: {
  name: string;
  title: string;
  description: string;
  mission: string;
  base: string;
  tools: readonly LlmsItem[];
  products: readonly LlmsItem[];
  pages: readonly LlmsPage[];
}): LlmsDoc {
  const link = (path: string) => `${input.base}${path}`;
  return {
    title: input.name,
    summary: `${input.title} ${input.description}`,
    details: [input.mission],
    sections: [
      {
        title: "Tools",
        links: input.tools.map((tool) => ({
          title: tool.name,
          url: link(`/tools/${tool.slug}`),
          note: tool.pitch,
        })),
      },
      {
        title: "Products",
        links: input.products.map((product) => ({
          title: product.name,
          url: link(`/products/${product.slug}`),
          note: itemNote(product),
        })),
      },
      {
        title: "Pages",
        links: input.pages.map((page) => ({
          title: page.title,
          url: link(page.path),
          note: page.note,
        })),
      },
    ],
  };
}

/**
 * Assemble the thoughtbuffer.app llms.txt document. The body paragraphs come first,
 * then the benefits as a Markdown bullet block (so a model gets the concrete
 * capabilities without a fake link per benefit), then a small Links section.
 */
export function buildThoughtBufferLlmsDoc(input: {
  name: string;
  tagline: string;
  description: string;
  url: string;
  rogueOakUrl: string;
  body?: readonly string[];
  benefits?: readonly string[];
}): LlmsDoc {
  const details = [
    ...(input.body ?? []),
    ...(input.benefits?.length
      ? [input.benefits.map((benefit) => `- ${benefit}`).join("\n")]
      : []),
  ];
  return {
    title: input.name,
    summary: `${input.tagline} ${input.description}`,
    details,
    sections: [
      {
        title: "Links",
        links: [
          { title: input.name, url: input.url, note: input.tagline },
          {
            title: "Rogue Oak",
            url: input.rogueOakUrl,
            note: "The company behind Thought Buffer.",
          },
        ],
      },
    ],
  };
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
