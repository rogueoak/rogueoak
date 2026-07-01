import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// Served at /sitemap.xml. Single-page site, so just the root route for now.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: new URL("/", site.url).toString(),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
