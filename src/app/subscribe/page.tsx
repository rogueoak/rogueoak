import type { Metadata } from "next";
import { ArrowRight } from "@rogueoak/icons";
import { SubscribeForm } from "@/components/subscribe-form";
import { projects } from "@/lib/content";

export const metadata: Metadata = {
  title: "Subscribe",
  description:
    "Subscribe to the Rogue Oak mailing list for the occasional update when a tool ships or grows.",
};

// A focused, shareable landing page for the mailing list (spec 0008). Not in the
// header (the site has no nav), but the shared header/footer render via the root
// layout, so home is one click away. Listed in the sitemap so the URL is
// discoverable when shared.
export default function SubscribePage() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <h1 className="text-h1 font-bold text-text">Subscribe</h1>
      <p className="mt-4 text-lg text-text-muted">
        Rogue Oak builds software that stands on its own. Subscribe to hear when
        something ships or grows - the occasional note when there is something worth
        sharing, nothing more.
      </p>

      <SubscribeForm
        source="subscribe_page"
        alwaysShowName
        heading={false}
        className="mt-8"
      />

      <div className="mt-16 border-t border-border pt-10">
        <h2 className="text-caption font-semibold tracking-wide text-text-subtle uppercase">
          While you are here
        </h2>
        <ul className="mt-5 space-y-4">
          {projects.map((project) => (
            <li key={project.name}>
              <a
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-baseline gap-2 rounded-sm text-text hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset focus-visible:outline-none"
              >
                <ArrowRight
                  className="size-4 shrink-0 translate-y-0.5 text-primary"
                  aria-hidden="true"
                />
                <span>
                  <span className="font-semibold">{project.name}</span>
                  <span className="text-text-muted"> - {project.pitch}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
