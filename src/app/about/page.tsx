import type { Metadata } from "next";
import { Reveal } from "@/components/reveal";
import { about, oakStory } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  description: about.intro,
};

/**
 * About: the mission and the oak name story. The mission copy is a deliberate
 * placeholder (`about.missionPending`) until the full story is written; the oak
 * story below it is the real anchor content, rendered as a quote (the accent bar
 * and indent use inline styles so the border renders identically across browsers,
 * matching the old name-story block).
 */
export default function AboutPage() {
  return (
    <section className="px-6 pt-10 pb-20 sm:pt-14 sm:pb-28">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <h1 className="text-h1 font-semibold tracking-tight text-balance">
            {about.heading}
          </h1>
          <p className="mt-5 text-h4 font-normal text-pretty text-text-muted">
            {about.intro}
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-8 rounded-xl border border-dashed border-border bg-surface/60 px-5 py-4">
            <p className="text-body-sm text-text-subtle">{about.missionPending}</p>
          </div>
        </Reveal>

        <div className="mt-16">
          <Reveal>
            <h2 className="text-h3 font-semibold tracking-tight">
              {about.storyHeading}
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <figure
              className="mt-6"
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
        </div>
      </div>
    </section>
  );
}
