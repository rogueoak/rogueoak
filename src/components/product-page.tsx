import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "@rogueoak/icons";
import { Button } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import type { Item } from "@/lib/content";

/**
 * A single tool or product page: the wide wordmark, an optional status badge, the
 * pitch, the longer body copy, the benefits, and the outbound repo / site link.
 * Shared by all five detail pages (three tools, two products) so they stay
 * consistent; `backHref` / `backLabel` point back to the listing the item came
 * from. The whole thing reveals on load.
 */
export function ProductPage({
  item,
  backHref,
  backLabel,
}: {
  item: Item;
  backHref: string;
  backLabel: string;
}) {
  return (
    <section className="px-6 pt-10 pb-20 sm:pt-14 sm:pb-28">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 rounded-sm text-body-sm text-text-muted underline-offset-4 hover:text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset focus-visible:outline-none"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {backLabel}
          </Link>
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-10">
            <Image
              src={item.logo}
              alt={item.name}
              width={520}
              height={150}
              className="mx-auto h-24 w-auto sm:h-36"
              priority
            />
            {item.status && (
              <p className="mt-3 text-center">
                <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-body-sm text-text-muted">
                  {item.status}
                </span>
              </p>
            )}
            <p className="mt-6 text-h4 text-pretty text-text-subtle italic">
              {item.pitch}
            </p>
          </div>
        </Reveal>

        <Reveal delay={160}>
          <div className="mt-8 space-y-4">
            {item.body.map((paragraph) => (
              <p key={paragraph} className="text-body text-pretty text-text-muted">
                {paragraph}
              </p>
            ))}
          </div>
        </Reveal>

        <Reveal delay={240}>
          <ul className="mt-8 space-y-2">
            {item.benefits.map((benefit) => (
              <li key={benefit} className="flex gap-2 text-body text-text-muted">
                <ArrowRight
                  className="mt-1 size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={320}>
          <Button asChild variant="outline" className="mt-10">
            <a href={item.href} target="_blank" rel="noopener noreferrer">
              {item.hrefLabel}
            </a>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
