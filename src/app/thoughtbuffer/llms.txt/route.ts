import { renderLlmsTxt, buildThoughtBufferLlmsDoc } from "@/lib/llms";
import { thoughtBuffer } from "@/lib/thought-buffer";
import { productBySlug } from "@/lib/content";
import { site } from "@/lib/site";

/**
 * thoughtbuffer.app llms.txt (spec 0013). A route handler under the subtree prefix,
 * remapped from thoughtbuffer.app/llms.txt by `proxy.ts`, mirroring the robots and
 * sitemap handlers here. The document is assembled by `buildThoughtBufferLlmsDoc`
 * from the `thought-buffer` product record in `content.ts`, so this stays in step
 * with both the landing page and the Rogue Oak product page. The publisher link
 * uses `site.url` (a build-time constant, not the request host), matching how the
 * landing page references Rogue Oak.
 */
export function GET(): Response {
  const product = productBySlug("thought-buffer");
  const doc = buildThoughtBufferLlmsDoc({
    name: thoughtBuffer.name,
    tagline: thoughtBuffer.tagline,
    description: thoughtBuffer.description,
    url: thoughtBuffer.url,
    rogueOakUrl: site.url,
    body: product?.body,
    benefits: product?.benefits,
  });

  return new Response(renderLlmsTxt(doc), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
