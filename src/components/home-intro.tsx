import Link from "next/link";
import { ArrowRight } from "@rogueoak/icons";
import { Reveal } from "@/components/reveal";
import { home } from "@/lib/content";

/**
 * The home pitch: a short lead on why Rogue Oak exists, then two cards that route
 * to the Tools and Products lists. Home stays lean and sends you deeper; the
 * mission and the oak story live on /about. Each card is a whole-block link.
 */
export function HomeIntro() {
  return (
    <section className="px-6 pt-6 pb-4 sm:pt-8">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <p className="text-center text-h4 font-normal text-pretty text-text-muted">
            {home.lead}
          </p>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {home.cards.map((card, index) => (
            <Reveal key={card.title} delay={index * 120}>
              <Link
                href={card.href}
                className="group flex h-full flex-col rounded-xl border border-border bg-surface p-6 transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset focus-visible:outline-none"
              >
                <h2 className="text-h3 font-semibold tracking-tight">{card.title}</h2>
                <p className="mt-3 flex-1 text-body text-pretty text-text-muted">
                  {card.blurb}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 font-medium text-primary">
                  {card.cta}
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
