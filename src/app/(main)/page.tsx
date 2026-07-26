import { Hero } from "@/components/hero";
import { HomeIntro } from "@/components/home-intro";
import { Subscribe } from "@/components/subscribe";

/**
 * Home: the pitch. The hero mark and tagline, a short lead on why Rogue Oak
 * exists with cards routing to Tools and Products, then the subscribe box. The
 * oak story and the mission moved to /about so home stays a quick read.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <HomeIntro />
      <Subscribe />
    </>
  );
}
