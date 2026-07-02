import Image from "next/image";
import { Reveal } from "@/components/reveal";
import { hero } from "@/lib/content";

/**
 * Hero: the Rogue Oak wordmark and the master tagline. First thing a visitor
 * lands on.
 */
export function Hero() {
  return (
    <Reveal as="section" className="px-6 pt-20 pb-8 sm:pt-28 sm:pb-10">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <h1 className="sr-only">{hero.name}</h1>
        <Image
          src={hero.wordmark}
          alt={hero.name}
          width={560}
          height={200}
          className="h-auto w-full max-w-md"
          priority
        />
        <p className="mt-6 text-h4 font-medium text-balance">{hero.tagline}</p>
      </div>
    </Reveal>
  );
}
