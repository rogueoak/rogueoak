import Image from "next/image";
import { ArrowRight } from "@rogueoak/icons";
import { Button } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import { comingSoon } from "@/lib/content";

/**
 * Coming Soon: early work that has not shipped yet, sitting between Projects and
 * Subscribe. Each item mirrors a Projects block - a wide product wordmark, pitch,
 * and benefits - so it sits in the same visual family; the "In early development"
 * badge under the wordmark is what marks it as a preview rather than a fourth
 * shipped product. Thought Stream is the first. Each block reveals on its own as
 * it scrolls into view.
 */
export function ComingSoon() {
  return (
    <section className="px-6 pt-8 pb-20 sm:pt-10 sm:pb-28">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <h2 className="text-h2 text-balance">{comingSoon.heading}</h2>
        </Reveal>
        <div className="mt-14 space-y-20">
          {comingSoon.items.map((item, index) => (
            <Reveal key={item.name} delay={index * 120}>
              <div>
                <Image
                  src={item.logo}
                  alt={item.name}
                  width={520}
                  height={150}
                  className="mx-auto h-20 w-auto sm:h-32"
                />
                <p className="mt-2 text-center">
                  <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-body-sm text-text-muted">
                    {item.status}
                  </span>
                </p>
                <p className="mt-5 text-lg text-pretty text-text-subtle italic">
                  {item.pitch}
                </p>
                <ul className="mt-5 space-y-2">
                  {item.benefits.map((benefit) => (
                    <li
                      key={benefit}
                      className="flex gap-2 text-body text-text-muted"
                    >
                      <ArrowRight
                        className="mt-1 size-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild variant="outline" className="mt-6">
                  <a href={item.href} target="_blank" rel="noopener noreferrer">
                    {item.hrefLabel}
                  </a>
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
