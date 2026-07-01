import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// Served at /manifest.webmanifest. Gives the site a name, theme color, and an
// install icon for "add to home screen" on mobile.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} - ${site.title}`,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#14100c",
    theme_color: "#14100c",
    icons: [
      { src: "/rogueoak-avatar.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/rogueoak-avatar.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
