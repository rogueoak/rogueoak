import { Hero } from "@/components/hero";
import { NameStory } from "@/components/name-story";
import { Projects } from "@/components/projects";
import { Subscribe } from "@/components/subscribe";

export default function Home() {
  return (
    <>
      <Hero />
      <NameStory />
      <Projects />
      <Subscribe />
    </>
  );
}
