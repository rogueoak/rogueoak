import type { Metadata } from "next";
import { Hero } from "@/components/hero";
import { HomeIntro } from "@/components/home-intro";
import { Subscribe } from "@/components/subscribe";

// Home inherits the layout's title/description/OG; it only needs its own canonical
// so the root URL is the authoritative one (no trailing-slash or query duplicates).
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

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
