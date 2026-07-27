import { renderLlmsTxt, buildSiteLlmsDoc } from "@/lib/llms";
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
 * language models, following the llmstxt.org convention. The document is assembled
 * by `buildSiteLlmsDoc` from `content.ts` and `site.ts` (so a new tool or product
 * appears automatically and the file can never drift from the pages); this handler
 * only wires the content in and renders. The Thought Buffer subtree serves its own
 * at app/thoughtbuffer/llms.txt; `proxy.ts` routes each host to the right one.
 */
export function GET(): Response {
  const doc = buildSiteLlmsDoc({
    name: site.name,
    title: site.title,
    description: site.description,
    mission,
    base: site.url,
    tools,
    products,
    pages: [
      { title: "About", path: "/about", note: about.intro },
      { title: "Tools", path: "/tools", note: toolsPage.intro },
      { title: "Products", path: "/products", note: productsPage.intro },
      { title: "Contact", path: "/contact", note: contact.intro },
    ],
  });

  return new Response(renderLlmsTxt(doc), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
