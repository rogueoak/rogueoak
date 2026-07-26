import type { Metadata, Viewport } from "next";
import { thoughtBuffer } from "@/lib/thought-buffer";

/**
 * thoughtbuffer.app chrome + metadata (spec 0012). This subtree is reached only via
 * the host rewrite in `proxy.ts` (thoughtbuffer.app/* -> /thoughtbuffer/*), so
 * everything here is hardcoded to thoughtbuffer.app and never reads the request
 * host. It sets its OWN `metadataBase`, title, OG card, and favicon, overriding the
 * rogueoak defaults, and wraps the page in `.theme-thoughtbuffer` so the shared
 * Canopy utilities render in the Thought Buffer palette. The Rogue Oak nav/footer
 * live in the sibling `(main)` group and never reach here.
 */
export const metadata: Metadata = {
  metadataBase: new URL(thoughtBuffer.url),
  title: { absolute: `${thoughtBuffer.name} - ${thoughtBuffer.tagline}` },
  description: thoughtBuffer.description,
  applicationName: thoughtBuffer.name,
  alternates: { canonical: "/" },
  icons: { icon: "/thought-buffer-icon.svg" },
  openGraph: {
    type: "website",
    siteName: thoughtBuffer.name,
    locale: "en_US",
    url: thoughtBuffer.url,
    title: `${thoughtBuffer.name} - ${thoughtBuffer.tagline}`,
    description: thoughtBuffer.description,
    images: [
      { url: "/thought-buffer-og.png", width: 1024, height: 1024, alt: thoughtBuffer.name },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${thoughtBuffer.name} - ${thoughtBuffer.tagline}`,
    description: thoughtBuffer.description,
    images: ["/thought-buffer-og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: thoughtBuffer.themeColor,
};

export default function ThoughtBufferLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="theme-thoughtbuffer flex min-h-dvh flex-1 flex-col bg-bg text-text">
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 py-8 text-caption text-text-muted sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {thoughtBuffer.name}. A{" "}
            <a
              href="https://rogueoak.com"
              className="text-text underline-offset-4 hover:underline"
            >
              Rogue Oak
            </a>{" "}
            product.
          </p>
          <a
            href="https://rogueoak.com/privacy"
            className="underline-offset-4 hover:underline"
          >
            Privacy
          </a>
        </div>
      </footer>
    </div>
  );
}
