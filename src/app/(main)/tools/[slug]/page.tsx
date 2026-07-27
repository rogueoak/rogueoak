import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPage } from "@/components/product-page";
import { JsonLd } from "@/components/json-ld";
import { tools, toolBySlug } from "@/lib/content";
import { site } from "@/lib/site";
import { softwareApplicationSchema, breadcrumbSchema } from "@/lib/structured-data";

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
  const path = `/tools/${item.slug}`;
  // Canonical + per-page social copy; the generated opengraph-image attaches
  // automatically, so no image URL is hand-wired here.
  return {
    title: item.name,
    description: item.pitch,
    alternates: { canonical: path },
    openGraph: { type: "website", url: path, title: item.name, description: item.pitch },
    twitter: { card: "summary_large_image", title: item.name, description: item.pitch },
  };
}

export default async function ToolDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const item = toolBySlug(slug);
  if (!item) notFound();
  // SoftwareApplication + breadcrumb so search and answer engines read the tool as
  // an entity and its place in the site, not just prose.
  const url = (path: string) => new URL(path, site.url).toString();
  const pageUrl = url(`/tools/${item.slug}`);
  const schemas = [
    softwareApplicationSchema(item, {
      category: "DeveloperApplication",
      pageUrl,
      publisherUrl: site.url,
    }),
    breadcrumbSchema([
      { name: site.name, url: url("/") },
      { name: "Tools", url: url("/tools") },
      { name: item.name, url: pageUrl },
    ]),
  ];
  return (
    <>
      <JsonLd data={schemas} />
      <ProductPage item={item} backHref="/tools" backLabel="All tools" />
    </>
  );
}
