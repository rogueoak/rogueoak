import { thoughtBuffer } from "@/lib/thought-buffer";

/**
 * thoughtbuffer.app sitemap (spec 0012). A route handler under the subtree prefix,
 * remapped from thoughtbuffer.app/sitemap.xml by `proxy.ts`. The landing is the
 * only page for now, so this lists the single root URL, hardcoded to thoughtbuffer.app.
 */
export function GET(): Response {
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    `  <url><loc>${thoughtBuffer.url}/</loc><changefreq>monthly</changefreq><priority>1.0</priority></url>`,
    "</urlset>",
    "",
  ].join("\n");
  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
