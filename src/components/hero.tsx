import Image from "next/image";
import { Reveal } from "@/components/reveal";
import { hero } from "@/lib/content";

/**
 * Hero: the Rogue Oak icon and name, with the master tagline as the byline
 * beneath. First thing a visitor lands on.
 */
export function Hero() {
  return (
    <Reveal as="section" className="px-6 pt-20 pb-4 sm:pt-28 sm:pb-6">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <Image
          src="/rogueoak-avatar.svg"
          alt=""
          width={96}
          height={96}
          className="size-20 sm:size-24"
          priority
        />
        <h1 className="mt-6 text-h1 font-semibold tracking-tight text-balance">
          {hero.name}
        </h1>
        <p className="mt-3 text-h4 font-normal text-text-muted text-balance">
          {hero.tagline}
        </p>
      </div>
    </Reveal>
  );
}
