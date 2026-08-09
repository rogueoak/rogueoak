import Link from "next/link";
import { ArrowRight } from "@rogueoak/icons";
import { Reveal } from "@/components/reveal";
import { home } from "@/lib/content";

/**
 * The home pitch: a short lead on why Rogue Oak exists, then the cards that route
 * into the sections. Home stays lean and sends you deeper; the mission and the oak
 * story live on /about. Each card is a whole-block link.
 *
 * The layout follows the card count rather than assuming two: a pair splits the
 * row, a lone card centres at half width instead of stretching the full column.
 * That mattered while Products was held back and there was one card, and it is
 * kept so the section survives the next time the set changes.
 */
export function HomeIntro() {
  // `home.cards` is `as const`, so its length is the literal `2` and comparing it
  // to 1 is statically false - TypeScript rejects the comparison outright. The
  // layout rule is about the data, which changes, so widen to `number` rather than
  // delete a branch that earns its place whenever the card set is edited.
  const cardCount: number = home.cards.length;
  const single = cardCount === 1;

  return (
    <section className="px-6 pt-6 pb-4 sm:pt-8">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <p className="text-center text-h4 font-normal text-pretty text-text-muted">
            {home.lead}
          </p>
        </Reveal>
        <div
          className={`mt-12 grid gap-5 ${single ? "sm:mx-auto sm:max-w-sm" : "sm:grid-cols-2"}`}
        >
          {home.cards.map((card, index) => (
            <Reveal key={card.title} delay={index * 120}>
              <Link
                href={card.href}
                className="group flex h-full flex-col rounded-xl border border-border bg-surface p-6 transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset focus-visible:outline-none"
              >
                <h2 className="text-h3 font-semibold tracking-tight">
                  {card.title}
                </h2>
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
