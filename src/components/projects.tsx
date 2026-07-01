import Image from "next/image";
import { ArrowRight } from "@rogueoak/icons";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { Reveal } from "@/components/reveal";
import { projects } from "@/lib/content";

/**
 * Projects showcase: one Canopy Card per product (Spectra, Trellis, Canopy), each
 * with the logo, name, pitch, benefits, and a repo link. Single column on mobile,
 * three across on wider screens. Each card reveals with a light stagger.
 */
export function Projects() {
  return (
    <Reveal as="section" className="px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-h2 text-balance">Projects</h2>
        <p className="mt-4 max-w-2xl text-body text-text-muted text-pretty">
          Three tools that ship today. Each installs into your own repos and gets
          out of your way.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {projects.map((project, index) => (
            <Reveal key={project.name} delay={index * 100}>
              <Card className="flex h-full flex-col">
                <CardHeader>
                  <Image
                    src={project.logo}
                    alt=""
                    width={48}
                    height={48}
                    className="size-12"
                  />
                  <CardTitle className="mt-4">{project.name}</CardTitle>
                  <CardDescription>{project.pitch}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {project.benefits.map((benefit) => (
                      <li
                        key={benefit}
                        className="flex gap-2 text-body-sm text-text-muted"
                      >
                        <ArrowRight
                          className="mt-1 size-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline">
                    <a
                      href={project.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {project.hrefLabel}
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
