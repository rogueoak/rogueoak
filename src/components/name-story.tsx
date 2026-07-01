import { Reveal } from "@/components/reveal";
import { oakStory } from "@/lib/content";

/**
 * The name story: the lone oak - strength, longevity, standing apart, and endless
 * value to its ecosystem - tied back to building customer value.
 */
export function NameStory() {
  return (
    <Reveal as="section" className="px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-h2 text-balance">{oakStory.heading}</h2>
        <div className="mt-6 space-y-4">
          {oakStory.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-body text-text-muted text-pretty">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
