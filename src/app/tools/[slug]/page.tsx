import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPage } from "@/components/product-page";
import { tools, toolBySlug } from "@/lib/content";

type PageProps = { params: Promise<{ slug: string }> };

// Statically generate exactly the three tool pages; any other slug 404s.
export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = toolBySlug(slug);
  if (!item) return {};
  return { title: item.name, description: item.pitch };
}

export default async function ToolDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const item = toolBySlug(slug);
  if (!item) notFound();
  return <ProductPage item={item} backHref="/tools" backLabel="All tools" />;
}
