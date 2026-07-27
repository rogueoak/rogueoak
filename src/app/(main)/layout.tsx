import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { JsonLd } from "@/components/json-ld";
import { organizationSchema, websiteSchema } from "@/lib/structured-data";
import { site, schemaSite } from "@/lib/site";

/**
 * rogueoak.com chrome + metadata (spec 0012). This route group holds every
 * rogueoak.com page; its layout supplies the nav, footer, and the site-wide
 * metadata that used to live in the root layout. Keeping it here (rather than the
 * shared root) is what stops the Rogue Oak nav/title/OG from leaking onto
 * thoughtbuffer.app, which is served from a sibling subtree under the same root.
 */
export const metadata: Metadata = {
  title: {
    default: `${site.name} - ${site.title}`,
    template: `%s - ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  category: "technology",
  keywords: [
    "Rogue Oak",
    "software",
    "developer tools",
    "spec-driven development",
    "Spectra",
    "Trellis",
    "Canopy",
    "design system",
    "AI agent conventions",
  ],
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_US",
    url: site.url,
    title: `${site.name} - ${site.title}`,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} - ${site.title}`,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <JsonLd data={[organizationSchema(schemaSite), websiteSchema(schemaSite)]} />
      <SiteNav />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
