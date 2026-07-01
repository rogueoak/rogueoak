import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Minimal site header: the Rogue Oak avatar + wordmark on the left, the theme
 * toggle on the right. A single-page site needs no nav, so this stays light.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/70">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2" aria-label={site.name}>
          <Image
            src="/rogueoak-avatar.svg"
            alt=""
            width={32}
            height={32}
            className="size-8 rounded-md"
            priority
          />
          <span className="font-semibold tracking-tight">{site.name}</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
