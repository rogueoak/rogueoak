import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { manifestIcons } from "@/lib/icons";

// Served at /manifest.webmanifest. Gives the site a name, theme color, and install icons for
// "add to home screen". The icon list comes from src/lib/icons.ts, which the generator and the
// tests read too, so a declared size can never drift from the bytes on disk.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} - ${site.title}`,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0a0d13",
    theme_color: "#0a0d13",
    icons: manifestIcons.map(({ src, sizes, type, purpose }) => ({ src, sizes, type, purpose })),
  };
}
