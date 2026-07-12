import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui";
import { notFound } from "@/lib/content";

export const metadata: Metadata = {
  title: "Page not found",
};

/**
 * 404 page: a lost visitor, kept inside the Rogue Oak theme (dark navy, the
 * oak avatar, Canopy button) and pointed back to the home page. Rendered by
 * Next's App Router for any unmatched route.
 */
export default function NotFound() {
  return (
    <Reveal as="section" className="px-6 py-24 sm:py-32">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <Image
          src="/rogueoak-avatar.svg"
          alt=""
          width={96}
          height={96}
          className="size-20 sm:size-24"
          priority
        />
        <p className="mt-6 font-mono text-caption tracking-widest text-text-subtle">
          {notFound.code}
        </p>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-balance">
          {notFound.heading}
        </h1>
        <p className="mt-4 text-h4 font-normal text-text-muted text-balance">
          {notFound.body}
        </p>
        <Button asChild className="mt-8">
          <Link href="/">{notFound.cta}</Link>
        </Button>
      </div>
    </Reveal>
  );
}
