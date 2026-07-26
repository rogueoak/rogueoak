import { itemOgResponse, OG_CONTENT_TYPE, OG_SIZE } from "@/components/og-card";
import { tools, toolBySlug } from "@/lib/content";

// Node runtime so a later revision can read fonts / assets off disk if needed.
export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Rogue Oak tool";

// One prebuilt card per tool, matching the page's generateStaticParams.
export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

type ImageProps = { params: Promise<{ slug: string }> };

export default async function Image({ params }: ImageProps) {
  const { slug } = await params;
  const item = toolBySlug(slug);
  if (!item) return new Response("Not found", { status: 404 });
  return itemOgResponse(item, "Rogue Oak Tools");
}
