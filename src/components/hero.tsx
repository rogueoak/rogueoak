import { Reveal } from "@/components/reveal";
import { hero } from "@/lib/content";

/**
 * Hero: the master tagline as the byline. The brand mark lives in the header, so
 * the hero leads with the promise. First thing a visitor lands on.
 */
export function Hero() {
  return (
    <Reveal as="section" className="px-6 pt-28 pb-20 sm:pt-36 sm:pb-28">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-h1 font-semibold text-balance sm:text-display">
          {hero.tagline}
        </h1>
      </div>
    </Reveal>
  );
}
