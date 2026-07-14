import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// Served at /sitemap.xml. The landing page, plus the shareable subscribe and
// privacy routes (spec 0007 / 0008) so they are discoverable when linked.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    {
      url: new URL("/", site.url).toString(),
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: new URL("/subscribe", site.url).toString(),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: new URL("/privacy", site.url).toString(),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
