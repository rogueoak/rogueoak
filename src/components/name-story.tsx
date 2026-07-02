import { Reveal } from "@/components/reveal";
import { oakStory } from "@/lib/content";

/**
 * The name story, as a quote: the lone oak - strength, longevity, standing apart,
 * and endless value to its ecosystem - tied back to building customer value.
 */
export function NameStory() {
  return (
    <Reveal as="section" className="px-6 py-20 sm:py-28">
      <figure className="mx-auto max-w-3xl border-l-2 border-primary pl-6 sm:pl-10">
        <blockquote className="space-y-3">
          {oakStory.paragraphs.map((paragraph) => (
            <p
              key={paragraph}
              className="text-body-sm font-normal text-pretty text-text-muted sm:text-body"
            >
              {paragraph}
            </p>
          ))}
        </blockquote>
        <figcaption className="mt-6 text-caption tracking-widest text-text-subtle uppercase">
          {oakStory.heading}
        </figcaption>
      </figure>
    </Reveal>
  );
}
