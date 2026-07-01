import { Github } from "@rogueoak/icons";
import { Button } from "@/components/ui";
import { site } from "@/lib/site";

/**
 * Minimal footer: Rogue Oak, the GitHub org link, and a "built with Canopy" note.
 */
export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <p className="text-caption text-text-muted">
          &copy; {new Date().getFullYear()} {site.name}. Built with Canopy.
        </p>
        <Button asChild variant="ghost" size="icon" aria-label="Rogue Oak on GitHub">
          <a href={site.githubOrg} target="_blank" rel="noopener noreferrer">
            <Github className="size-5" />
          </a>
        </Button>
      </div>
    </footer>
  );
}
