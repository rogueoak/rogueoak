import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PostHogProvider } from "@/components/posthog-provider";
import { site } from "@/lib/site";

/**
 * Root shell for the site: the `<html>`/`<body>` element, the dark theme class,
 * the shared fonts, and the PostHog provider. It deliberately renders NO nav or
 * footer and carries no brand-specific metadata: rogueoak.com's chrome + metadata
 * live in the `(main)` route group. `metadataBase` is the rogueoak.com default.
 */
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
};

export const viewport: Viewport = {
  // Dark-only default.
  themeColor: "#0a0d13",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="flex min-h-full flex-col bg-bg font-sans text-text">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
