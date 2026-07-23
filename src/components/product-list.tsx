import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@rogueoak/icons";
import { Reveal } from "@/components/reveal";
import type { Item } from "@/lib/content";

/**
 * A listing of tools or products: one block per item, each a wide product
 * wordmark, its pitch, its benefits, and a "Learn more" link into the item's
 * detail page (`${basePath}/${slug}`). Products carry a status badge under the
 * wordmark; tools do not. Shared by /tools and /products so the two lists stay
 * visually identical. Each block reveals on its own on load.
 */
export function ProductList({
  items,
  basePath,
}: {
  items: readonly Item[];
  basePath: string;
}) {
  return (
    <div className="mt-14 space-y-20">
      {items.map((item, index) => {
        const href = `${basePath}/${item.slug}`;
        return (
          <Reveal key={item.slug} delay={index * 120}>
            <div>
              <Link
                href={href}
                aria-label={item.name}
                className="block rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset focus-visible:outline-none"
              >
                <Image
                  src={item.logo}
                  alt={item.name}
                  width={520}
                  height={150}
                  className="mx-auto h-20 w-auto sm:h-32"
                />
              </Link>
              {item.status && (
                <p className="mt-2 text-center">
                  <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-body-sm text-text-muted">
                    {item.status}
                  </span>
                </p>
              )}
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
              <Link
                href={href}
                className="mt-6 inline-flex items-center gap-1.5 rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset focus-visible:outline-none"
              >
                Learn more about {item.name}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
