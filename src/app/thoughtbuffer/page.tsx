import Image from "next/image";
import { Reveal } from "@/components/reveal";
import { SubscribeForm } from "@/components/subscribe-form";
import { JsonLd } from "@/components/json-ld";
import { productBySlug } from "@/lib/content";
import { thoughtBuffer } from "@/lib/thought-buffer";
import { site } from "@/lib/site";
import { organizationSchema, softwareApplicationSchema } from "@/lib/structured-data";

/**
 * thoughtbuffer.app landing (spec 0012): a coming-soon page with a waitlist. The
 * product copy (pitch, benefits, longer body) is the single `thought-buffer` entry
 * in `content.ts`, so the card on rogueoak.com and this page can never drift. The
 * waitlist reuses the shared subscribe form, tagged to the Thought Buffer audience
 * so signups land on their own Constant Contact list.
 */
export default function ThoughtBufferLanding() {
  const product = productBySlug("thought-buffer");
  if (!product) return null;

  // The app as an entity, published by Rogue Oak (spec 0013). The publisher @id
  // points at rogueoak.com, so the accompanying Organization node resolves it.
  const schemas = [
    softwareApplicationSchema(product, {
      category: "MobileApplication",
      pageUrl: thoughtBuffer.url,
      publisherUrl: site.url,
    }),
    organizationSchema({
      name: site.name,
      description: site.description,
      url: site.url,
      logo: site.logo,
      sameAs: [site.githubOrg, site.personalSite],
    }),
  ];

  return (
    <div className="px-6 pt-16 pb-24 sm:pt-24 sm:pb-32">
      <JsonLd data={schemas} />
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <Image
            src={product.logo}
            alt={thoughtBuffer.name}
            width={520}
            height={150}
            className="h-20 w-auto sm:h-28"
            priority
          />
          {product.status && (
            <p className="mt-6 inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-caption font-medium text-accent">
              {product.status}
            </p>
          )}
          <h1 className="mt-6 text-h1 font-semibold tracking-tight text-balance">
            {thoughtBuffer.tagline}
          </h1>
          <p className="mt-5 text-h4 font-normal text-pretty text-text-muted">
            {product.pitch}
          </p>
        </Reveal>

        <Reveal delay={80}>
          <ul className="mt-12 flex flex-col gap-5 border-t border-border pt-10">
            {product.benefits.map((benefit) => (
              <li key={benefit} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent"
                />
                <span className="text-body text-text-muted text-pretty">{benefit}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={160}>
          <div className="mt-12 flex flex-col gap-4 text-body text-text-muted text-pretty">
            {product.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </Reveal>

        <Reveal delay={240}>
          <div className="mt-14 border-t border-border pt-12">
            <SubscribeForm
              source="thought_buffer"
              audience="thought-buffer"
              title="Get on the waitlist"
              description="One note when Thought Buffer is ready for you. No spam; unsubscribe anytime."
              successBadge="You are on the waitlist"
              successMessage="Thanks. You will hear from Thought Buffer when it is ready. Look in your junk or spam folder if the confirmation does not land in your inbox, and mark it as not spam so you do not miss the launch."
            />
          </div>
        </Reveal>
      </div>
    </div>
  );
}
