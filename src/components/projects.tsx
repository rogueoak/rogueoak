import Image from "next/image";
import { ArrowRight } from "@rogueoak/icons";
import { Button } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import { projects } from "@/lib/content";

/**
 * Projects showcase: one column, one product per block (Spectra, Trellis,
 * Canopy). The product wordmark leads as the focus, then the pitch, then the
 * benefits listed underneath. No card - the page background stays consistent.
 * Each block reveals on its own as it scrolls into view.
 */
export function Projects() {
  return (
    <section className="px-6 pt-8 pb-20 sm:pt-10 sm:pb-28">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <h2 className="text-h2 text-balance">Projects</h2>
        </Reveal>
        <div className="mt-14 space-y-20">
          {projects.map((project, index) => (
            <Reveal key={project.name} delay={index * 120}>
              <div>
                <Image
                  src={project.logo}
                  alt={project.name}
                  width={520}
                  height={150}
                  className="mx-auto h-20 w-auto sm:h-32"
                />
                <p className="mt-5 text-lg text-pretty text-text-subtle italic">
                  {project.pitch}
                </p>
                <ul className="mt-5 space-y-2">
                  {project.benefits.map((benefit) => (
                    <li
                      key={benefit}
                      className="flex gap-2 text-body text-text-muted"
                    >
                      <ArrowRight
                        className="mt-1 size-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild variant="outline" className="mt-6">
                  <a href={project.href} target="_blank" rel="noopener noreferrer">
                    {project.hrefLabel}
                  </a>
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
