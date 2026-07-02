import { Reveal } from "@/components/reveal";
import { oakStory } from "@/lib/content";

/**
 * The name story, as a quote: the lone oak - strength, longevity, standing apart,
 * and endless value to its ecosystem - tied back to building customer value.
 *
 * The accent bar and indent use an inline style rather than Tailwind's
 * `border-l`/`pl` utilities so the quote formatting renders identically across
 * browsers (some drop the utility-driven left border).
 */
export function NameStory() {
  return (
    <Reveal as="section" className="px-6 py-20 sm:py-28">
      <figure
        className="mx-auto max-w-3xl"
        style={{
          borderLeft: "2px solid var(--color-primary)",
          paddingLeft: "1.75rem",
        }}
      >
        <blockquote className="space-y-3">
          {oakStory.paragraphs.map((paragraph) => (
            <p
              key={paragraph}
              className="text-body-sm text-pretty text-text-muted italic sm:text-body"
            >
              {paragraph}
            </p>
          ))}
        </blockquote>
      </figure>
    </Reveal>
  );
}
