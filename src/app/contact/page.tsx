import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { Reveal } from "@/components/reveal";
import { contact } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact",
  description: contact.intro,
};

/** Contact: a note straight to the Rogue Oak inbox (Resend), with an opt-in to the list. */
export default function ContactPage() {
  return (
    <section className="px-6 pt-10 pb-20 sm:pt-14 sm:pb-28">
      <div className="mx-auto max-w-2xl">
        <Reveal>
          <h1 className="text-h1 font-semibold tracking-tight text-balance">
            {contact.heading}
          </h1>
          <p className="mt-5 text-lg text-pretty text-text-muted">{contact.intro}</p>
        </Reveal>
        <Reveal delay={100}>
          <div className="mt-10">
            <ContactForm />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
