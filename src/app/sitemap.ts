import type { MetadataRoute } from "next";
import { products, tools } from "@/lib/content";
import { site } from "@/lib/site";

// Served at /sitemap.xml. Lists every crawlable route: home, the section pages
// (about, tools, products, contact), each tool and product detail page, and the
// shareable subscribe / privacy routes. Detail routes derive from content.ts so a
// new tool or product appears here automatically.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const url = (path: string) => new URL(path, site.url).toString();
  // The site share card, attached to the section entries so image search and rich
  // results have something to anchor to. Detail entries use the item wordmark.
  const siteImage = url(site.logo);

  const sections: MetadataRoute.Sitemap = [
    { url: url("/"), lastModified, changeFrequency: "monthly", priority: 1, images: [siteImage] },
    { url: url("/about"), lastModified, changeFrequency: "monthly", priority: 0.7, images: [siteImage] },
    { url: url("/tools"), lastModified, changeFrequency: "monthly", priority: 0.8, images: [siteImage] },
    { url: url("/products"), lastModified, changeFrequency: "monthly", priority: 0.8, images: [siteImage] },
    { url: url("/contact"), lastModified, changeFrequency: "yearly", priority: 0.6, images: [siteImage] },
    { url: url("/subscribe"), lastModified, changeFrequency: "monthly", priority: 0.6, images: [siteImage] },
    { url: url("/privacy"), lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];

  const toolPages: MetadataRoute.Sitemap = tools.map((tool) => ({
    url: url(`/tools/${tool.slug}`),
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
    images: [url(tool.logo)],
  }));

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: url(`/products/${product.slug}`),
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
    images: [url(product.logo)],
  }));

  return [...sections, ...toolPages, ...productPages];
}
