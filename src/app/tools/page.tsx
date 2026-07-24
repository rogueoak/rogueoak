import type { Metadata } from "next";
import { ProductList } from "@/components/product-list";
import { Reveal } from "@/components/reveal";
import { tools, toolsPage } from "@/lib/content";

export const metadata: Metadata = {
  title: "Tools",
  description: toolsPage.intro,
};

/** Tools listing: Spectra, Trellis, and Canopy, each linking to its own page. */
export default function ToolsPage() {
  return (
    <section className="px-6 pt-10 pb-20 sm:pt-14 sm:pb-28">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <h1 className="text-h1 font-semibold tracking-tight text-balance">
            {toolsPage.heading}
          </h1>
          <p className="mt-5 text-h4 font-normal text-pretty text-text-muted">
            {toolsPage.intro}
          </p>
        </Reveal>
        <ProductList items={tools} basePath="/tools" />
      </div>
    </section>
  );
}
