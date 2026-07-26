import { itemOgResponse, OG_CONTENT_TYPE, OG_SIZE } from "@/components/og-card";
import { products, productBySlug } from "@/lib/content";

// Node runtime so a later revision can read fonts / assets off disk if needed.
export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Rogue Oak product";

// One prebuilt card per product, matching the page's generateStaticParams.
export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

type ImageProps = { params: Promise<{ slug: string }> };

export default async function Image({ params }: ImageProps) {
  const { slug } = await params;
  const item = productBySlug(slug);
  if (!item) return new Response("Not found", { status: 404 });
  return itemOgResponse(item, "Rogue Oak Products");
}
