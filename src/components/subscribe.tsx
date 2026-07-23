import { Reveal } from "@/components/reveal";
import { SubscribeForm } from "@/components/subscribe-form";

/**
 * The "Subscribe for updates" section at the foot of the home page (spec 0008),
 * below the pitch cards. Shares the home container width and the on-load `Reveal`
 * fade so it reads as the natural closing beat of the page. The form itself is a
 * client island; this wrapper stays a server component.
 */
export function Subscribe() {
  return (
    <section className="px-6 pb-24 sm:pb-32">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <div className="border-t border-border pt-14">
            <SubscribeForm source="home" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
