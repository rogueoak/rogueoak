import type { Metadata } from "next";
import { ProductList } from "@/components/product-list";
import { Reveal } from "@/components/reveal";
import { products, productsPage } from "@/lib/content";

export const metadata: Metadata = {
  title: "Products",
  description: productsPage.intro,
};

/** Products listing: Thought Stream and Branch Out Games, each linking to its page. */
export default function ProductsPage() {
  return (
    <section className="px-6 pt-10 pb-20 sm:pt-14 sm:pb-28">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <h1 className="text-h1 font-semibold tracking-tight text-balance">
            {productsPage.heading}
          </h1>
          <p className="mt-5 text-h4 font-normal text-pretty text-text-muted">
            {productsPage.intro}
          </p>
        </Reveal>
        <ProductList items={products} basePath="/products" />
      </div>
    </section>
  );
}
