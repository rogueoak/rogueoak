import Image from "next/image";
import { Github } from "@rogueoak/icons";
import { Button } from "@/components/ui";
import { site } from "@/lib/site";

/**
 * Minimal footer: Rogue Oak, a "built with Canopy" note, and links out to the
 * GitHub org and to matthewmaynes.com (the person behind Rogue Oak).
 */
export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <p className="text-caption text-text-muted">
          &copy; {new Date().getFullYear()} {site.name}. Built with{" "}
          <a
            href={`${site.githubOrg}/canopy`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-2 hover:underline"
          >
            Canopy
          </a>
          .
        </p>
        <div className="flex items-center gap-1">
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label="Rogue Oak on GitHub"
          >
            <a href={site.githubOrg} target="_blank" rel="noopener noreferrer">
              <Github className="size-5" />
            </a>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="matthewmaynes.com">
            <a
              href={site.personalSite}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/matthewmaynes.png"
                alt=""
                width={20}
                height={20}
                className="size-5 rounded-sm"
              />
            </a>
          </Button>
        </div>
      </div>
    </footer>
  );
}
