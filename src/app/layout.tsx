import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { SiteFooter } from "@/components/site-footer";
import { ThemeScript } from "@/components/theme-script";
import { PostHogProvider } from "@/components/posthog-provider";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} - ${site.title}`,
    template: `%s - ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  // Open Graph: the card shown when the link is pasted into iMessage, Slack,
  // LinkedIn, Discord, etc. The image comes from app/opengraph-image.tsx.
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

export const viewport: Viewport = {
  // Tints mobile browser chrome (best-effort: reflects the OS color scheme, not
  // the in-page toggle).
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f3" },
    { media: "(prefers-color-scheme: dark)", color: "#14100c" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-full flex-col bg-bg font-sans text-text">
        <PostHogProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </PostHogProvider>
      </body>
    </html>
  );
}
