import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPage } from "@/components/product-page";
import { JsonLd } from "@/components/json-ld";
import { products, productBySlug } from "@/lib/content";
import { site } from "@/lib/site";
import { softwareApplicationSchema, breadcrumbSchema } from "@/lib/structured-data";

type PageProps = { params: Promise<{ slug: string }> };

// The schema.org applicationCategory per product: Branch Out Games is a game.
// Falls back to a generic app category for anything new.
const PRODUCT_CATEGORY: Record<string, string> = {
  "branch-out": "GameApplication",
};

// Statically generate the product pages; any other slug 404s.
export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = productBySlug(slug);
  if (!item) return {};
  const path = `/products/${item.slug}`;
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

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const item = productBySlug(slug);
  if (!item) notFound();
  // SoftwareApplication + breadcrumb. The honest "coming soon" stays in the visible
  // copy; the schema only states what the product is.
  const url = (path: string) => new URL(path, site.url).toString();
  const pageUrl = url(`/products/${item.slug}`);
  const schemas = [
    softwareApplicationSchema(item, {
      category: PRODUCT_CATEGORY[item.slug] ?? "WebApplication",
      pageUrl,
      publisherUrl: site.url,
    }),
    breadcrumbSchema([
      { name: site.name, url: url("/") },
      { name: "Products", url: url("/products") },
      { name: item.name, url: pageUrl },
    ]),
  ];
  return (
    <>
      <JsonLd data={schemas} />
      <ProductPage item={item} backHref="/products" backLabel="All products" />
    </>
  );
}
