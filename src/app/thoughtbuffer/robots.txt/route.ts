import { thoughtBuffer } from "@/lib/thought-buffer";

/**
 * thoughtbuffer.app robots (spec 0012). A route handler (not the root `robots.ts`
 * metadata convention, which is rogueoak.com's) so it can live under the subtree
 * prefix. `proxy.ts` remaps thoughtbuffer.app/robots.txt onto this. Hardcoded
 * to thoughtbuffer.app so it can never reference rogueoak.com.
 */
export function GET(): Response {
  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${thoughtBuffer.url}/sitemap.xml`,
    `Host: ${thoughtBuffer.url}`,
    "",
  ].join("\n");
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
