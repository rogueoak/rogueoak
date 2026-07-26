import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

// The one public address for privacy requests. Rendered only here, never in the
// shared footer, so it does not leak onto other routes.
const PRIVACY_EMAIL = "privacy@rogueoak.com";

// An external link that opens safely in a new tab. Used for the processors' own
// privacy policies.
function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline-offset-4 hover:underline"
    >
      {children}
    </a>
  );
}

// Rogue Oak's privacy policy (spec 0007). Written in the third person - this is a
// business site, so the policy speaks about "Rogue Oak", not "I" - and trimmed to
// what is actually true here: privacy-friendly analytics and a mailing list, and
// nothing else (no contact form, no Resend, no accounts).
export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <h1 className="text-h1 font-bold text-text">Privacy Policy</h1>
      <p className="mt-2 text-caption text-text-muted">Last updated: July 14, 2026</p>

      <p className="mt-6 text-body text-text-muted">
        This is the website for Rogue Oak, where the software it builds - Spectra, Trellis, and
        Canopy - is shared. Rogue Oak cares about privacy, so this page explains in plain language
        exactly what happens to your data when you visit. There is not much to it.
      </p>

      <section className="mt-12">
        <h2 className="text-h2 font-semibold text-text">The short version</h2>
        <p className="mt-3 text-body text-text-muted">
          Rogue Oak does not sell your data. It does not run ads. It does not use tracking cookies,
          and it does not share your information with advertisers or data brokers. The site uses
          privacy-friendly analytics to understand how it is used, and it has a mailing list you can
          join. That is the whole story.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-h2 font-semibold text-text">Analytics</h2>
        <p className="mt-3 text-body text-text-muted">
          Rogue Oak uses PostHog to understand how people use the site, for example which pages are
          visited and whether something is broken. This helps improve it.
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-body text-text-muted">
          <li>
            Analytics run only on the live site. Nothing is collected when the site runs locally or
            in development.
          </li>
          <li>
            PostHog stores a small amount of data in your browser&apos;s local storage to recognize
            repeat visits. It does not set advertising or cross-site tracking cookies.
          </li>
          <li>
            The site records anonymized session replays, that is, a playback of how a visitor moves,
            scrolls, and clicks on a page. Every form input is masked, so anything you type,
            including your email or name on the subscribe form, is never captured in a replay.
          </li>
          <li>The site also reports errors and crashes to PostHog so they can be fixed.</li>
        </ul>
        <p className="mt-3 text-body text-text-muted">
          PostHog processes this data on Rogue Oak&apos;s behalf on servers in the United States. You
          can read how PostHog handles data in their{" "}
          <ExternalLink href="https://posthog.com/privacy">privacy policy</ExternalLink>.
        </p>
        <p className="mt-3 text-body text-text-muted">
          Because this setup is cookieless, collects no directly identifying information beyond what
          your browser normally reveals, and is used only to keep the site working well, Rogue Oak
          relies on legitimate interest as the basis for it.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-h2 font-semibold text-text">The mailing list</h2>
        <p className="mt-3 text-body text-text-muted">
          If you subscribe - from the subscribe form on the home page or the dedicated subscribe
          page - Rogue Oak adds your email address, and your name if you give one, to its mailing
          list so it can send you the occasional update about Rogue Oak.
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-body text-text-muted">
          <li>
            The list is managed by Constant Contact, which stores and processes it on Rogue Oak&apos;s
            behalf on servers in the United States. You can read how they handle data in their{" "}
            <ExternalLink href="https://www.constantcontact.com/legal/privacy-notice">
              privacy notice
            </ExternalLink>
            .
          </li>
          <li>
            You can unsubscribe at any time using the link in the footer of any email, and Rogue Oak
            uses your address only to send these updates.
          </li>
          <li>The subscribe form is protected by basic anti-spam measures.</li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-h2 font-semibold text-text">IP addresses and server logs</h2>
        <p className="mt-3 text-body text-text-muted">
          Like any website, the server briefly sees your IP address when you visit. Rogue Oak uses it
          only to keep the site secure and to limit spam, for example rate-limiting the subscribe
          form. PostHog may also use your IP address to estimate a general location, such as country
          or region, and does not store a precise location. Rogue Oak does not use IP addresses to
          identify you personally.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-h2 font-semibold text-text">What Rogue Oak does not collect</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-body text-text-muted">
          <li>No advertising or cross-site tracking.</li>
          <li>
            No third-party fonts, embeds, or content delivery networks that could track you. Fonts
            and images are served directly from the site.
          </li>
          <li>No account, login, or password, because there is nothing to sign in to.</li>
          <li>No comment system.</li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-h2 font-semibold text-text">Your choices and rights</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-body text-text-muted">
          <li>
            You can block analytics with your browser&apos;s privacy settings or a content blocker,
            and the site will work fine.
          </li>
          <li>
            Depending on where you live, you may have the right to ask what data relates to you, to
            request a copy, or to ask Rogue Oak to delete it. Since it stores almost nothing, this is
            usually quick.
          </li>
        </ul>
        <p className="mt-3 text-body text-text-muted">
          To make a request, email Rogue Oak at{" "}
          <a
            href={`mailto:${PRIVACY_EMAIL}`}
            className="text-primary underline-offset-4 hover:underline"
          >
            {PRIVACY_EMAIL}
          </a>
          .
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-h2 font-semibold text-text">Children</h2>
        <p className="mt-3 text-body text-text-muted">
          This site is not directed at children, and Rogue Oak does not knowingly collect information
          from them.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-h2 font-semibold text-text">Changes to this policy</h2>
        <p className="mt-3 text-body text-text-muted">
          If Rogue Oak changes how the site handles data, it will update this page and the date at
          the top.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-h2 font-semibold text-text">Contact</h2>
        <p className="mt-3 text-body text-text-muted">
          Questions about privacy? Email{" "}
          <a
            href={`mailto:${PRIVACY_EMAIL}`}
            className="text-primary underline-offset-4 hover:underline"
          >
            {PRIVACY_EMAIL}
          </a>
          .
        </p>
      </section>
    </section>
  );
}
