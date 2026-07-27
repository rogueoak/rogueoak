import { renderLlmsTxt, type LlmsSection } from "@/lib/llms";
import { site } from "@/lib/site";
import {
  mission,
  products,
  tools,
  toolsPage,
  productsPage,
  about,
  contact,
} from "@/lib/content";

/**
 * Served at /llms.txt (spec 0013): a curated, link-first map of rogueoak.com for
 * language models, following the llmstxt.org convention. Built from `content.ts`
 * and `site.ts` so a new tool or product appears automatically and the file can
 * never drift from the pages. The Thought Buffer subtree serves its own at
 * app/thoughtbuffer/llms.txt; `proxy.ts` routes each host to the right one.
 */
export function GET(): Response {
  const url = (path: string) => new URL(path, site.url).toString();

  const toolLinks: LlmsSection = {
    title: "Tools",
    links: tools.map((tool) => ({
      title: tool.name,
      url: url(`/tools/${tool.slug}`),
      note: tool.pitch,
    })),
  };

  const productLinks: LlmsSection = {
    title: "Products",
    links: products.map((product) => ({
      title: product.name,
      url: url(`/products/${product.slug}`),
      note: product.status ? `${product.pitch} (${product.status})` : product.pitch,
    })),
  };

  const pageLinks: LlmsSection = {
    title: "Pages",
    links: [
      { title: "About", url: url("/about"), note: about.intro },
      { title: "Tools", url: url("/tools"), note: toolsPage.intro },
      { title: "Products", url: url("/products"), note: productsPage.intro },
      { title: "Contact", url: url("/contact"), note: contact.intro },
    ],
  };

  const body = renderLlmsTxt({
    title: site.name,
    summary: `${site.title} ${site.description}`,
    details: [mission],
    sections: [toolLinks, productLinks, pageLinks],
  });

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
