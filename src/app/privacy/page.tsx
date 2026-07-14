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

// Rogue Oak's privacy policy (spec 0007). Adapted from matthewmaynes' policy but
// trimmed to what is actually true here: this site has privacy-friendly analytics
// and a mailing list, and nothing else - no contact form, no Resend, no accounts.
export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <h1 className="text-h1 font-bold text-text">Privacy Policy</h1>
      <p className="mt-2 text-caption text-text-muted">Last updated: July 13, 2026</p>

      <p className="mt-6 text-body text-text-muted">
        This is the website for Rogue Oak, where I share the tools I build - Spectra, Trellis,
        and Canopy. I care about privacy, so this page explains in plain language exactly what
        happens to your data when you visit. There is not much to it.
      </p>

      <section className="mt-12">
        <h2 className="text-h2 font-semibold text-text">The short version</h2>
        <p className="mt-3 text-body text-text-muted">
          I do not sell your data. I do not run ads. I do not use tracking cookies, and I do not
          share your information with advertisers or data brokers. The site uses privacy-friendly
          analytics to understand how it is used, and it has a mailing list you can join. That is
          the whole story.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-h2 font-semibold text-text">Analytics</h2>
        <p className="mt-3 text-body text-text-muted">
          I use PostHog to understand how people use the site, for example which pages are visited
          and whether something is broken. This helps me improve it.
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-body text-text-muted">
          <li>
            Analytics run only on the live site. Nothing is collected when the site runs locally
            or in development.
          </li>
          <li>
            PostHog stores a small amount of data in your browser&apos;s local storage to
            recognize repeat visits. It does not set advertising or cross-site tracking cookies.
          </li>
          <li>
            I record anonymized session replays, that is, a playback of how a visitor moves,
            scrolls, and clicks on a page. Every form input is masked, so anything you type,
            including your email or name on the subscribe form, is never captured in a replay.
          </li>
          <li>The site also reports errors and crashes to PostHog so I can fix them.</li>
        </ul>
        <p className="mt-3 text-body text-text-muted">
          PostHog processes this data on my behalf on servers in the United States. You can read
          how PostHog handles data in their{" "}
          <ExternalLink href="https://posthog.com/privacy">privacy policy</ExternalLink>.
        </p>
        <p className="mt-3 text-body text-text-muted">
          Because this setup is cookieless, collects no directly identifying information beyond
          what your browser normally reveals, and is used only to keep a small site working well,
          I rely on legitimate interest as the basis for it.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-h2 font-semibold text-text">The mailing list</h2>
        <p className="mt-3 text-body text-text-muted">
          If you subscribe - from the subscribe form on the home page or the dedicated subscribe
          page - I add your email address, and your name if you give one, to my mailing list so I
          can send you the occasional update about Rogue Oak.
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-body text-text-muted">
          <li>
            The list is managed by Constant Contact, which stores and processes it on my behalf on
            servers in the United States. You can read how they handle data in their{" "}
            <ExternalLink href="https://www.constantcontact.com/legal/privacy-notice">
              privacy notice
            </ExternalLink>
            .
          </li>
          <li>
            You can unsubscribe at any time using the link in the footer of any email I send, and
            I use your address only to send these updates.
          </li>
          <li>The subscribe form is protected by basic anti-spam measures.</li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-h2 font-semibold text-text">IP addresses and server logs</h2>
        <p className="mt-3 text-body text-text-muted">
          Like any website, my server briefly sees your IP address when you visit. I use it only
          to keep the site secure and to limit spam, for example rate-limiting the subscribe form.
          PostHog may also use your IP address to estimate a general location, such as country or
          region, and does not store a precise location. I do not use IP addresses to identify you
          personally.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-h2 font-semibold text-text">What I do not collect</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-body text-text-muted">
          <li>No advertising or cross-site tracking.</li>
          <li>
            No third-party fonts, embeds, or content delivery networks that could track you. Fonts
            and images are served directly from my site.
          </li>
          <li>No account, login, or password, because there is nothing to sign in to.</li>
          <li>No comment system.</li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-h2 font-semibold text-text">Your choices and rights</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-body text-text-muted">
          <li>
            You can block analytics with your browser&apos;s privacy settings or a content
            blocker, and the site will work fine.
          </li>
          <li>
            Depending on where you live, you may have the right to ask what data relates to you,
            to request a copy, or to ask me to delete it. Since I store almost nothing, this is
            usually quick.
          </li>
        </ul>
        <p className="mt-3 text-body text-text-muted">
          To make a request, email me at{" "}
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
          This site is not directed at children, and I do not knowingly collect information from
          them.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-h2 font-semibold text-text">Changes to this policy</h2>
        <p className="mt-3 text-body text-text-muted">
          If I change how the site handles data, I will update this page and the date at the top.
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
