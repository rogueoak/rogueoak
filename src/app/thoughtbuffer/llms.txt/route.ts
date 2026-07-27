import { renderLlmsTxt } from "@/lib/llms";
import { thoughtBuffer } from "@/lib/thought-buffer";
import { productBySlug } from "@/lib/content";

/**
 * thoughtbuffer.app llms.txt (spec 0013). A route handler under the subtree prefix,
 * remapped from thoughtbuffer.app/llms.txt by `proxy.ts`, mirroring the robots and
 * sitemap handlers here. Hardcoded to thoughtbuffer.app; the on-page copy (body,
 * benefits) is the `thought-buffer` product record in `content.ts`, so this stays in
 * step with both the landing page and the Rogue Oak product page.
 */
export function GET(): Response {
  const product = productBySlug("thought-buffer");
  // Body paragraphs, then the benefits as a Markdown bullet block, so a model gets
  // the pitch and the concrete capabilities without inventing fake links for them.
  const details = [
    ...(product?.body ?? []),
    ...(product?.benefits.length
      ? [product.benefits.map((benefit) => `- ${benefit}`).join("\n")]
      : []),
  ];

  const body = renderLlmsTxt({
    title: thoughtBuffer.name,
    summary: `${thoughtBuffer.tagline} ${thoughtBuffer.description}`,
    details,
    sections: [
      {
        title: "Links",
        links: [
          { title: "Thought Buffer", url: thoughtBuffer.url, note: thoughtBuffer.tagline },
          {
            title: "Rogue Oak",
            url: "https://rogueoak.com",
            note: "The company behind Thought Buffer.",
          },
        ],
      },
    ],
  });

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
