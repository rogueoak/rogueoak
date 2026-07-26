import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPage } from "@/components/product-page";
import { products, productBySlug } from "@/lib/content";

type PageProps = { params: Promise<{ slug: string }> };

// Statically generate exactly the two product pages; any other slug 404s.
export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = productBySlug(slug);
  if (!item) return {};
  return { title: item.name, description: item.pitch };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const item = productBySlug(slug);
  if (!item) notFound();
  return <ProductPage item={item} backHref="/products" backLabel="All products" />;
}
