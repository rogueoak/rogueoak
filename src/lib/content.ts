/**
 * Page copy in one reviewable, testable place. The voice follows the rogueoak
 * language rules: address the reader as "you", stay terse, no hype words, and
 * ASCII only (never em / en dashes), and avoid " - " as a sentence break - prefer
 * a colon, period, or comma so the copy reads clean. Shipped products
 * are described in confident present tense as software; anything not yet shipped
 * lives in `comingSoon` and is labeled as the early work it is.
 *
 * This module is import-free on purpose: `node --test` loads it directly to
 * assert on the copy, so it must not pull in path-aliased or extensionless
 * modules. It is the source of truth for the brand name and tagline - `site.ts`
 * derives its identity strings from `hero` here, rather than restating them.
 */

export type Project = {
  /** Product name as shown on the card. */
  name: string;
  /** Public path to the product logo (served from public/). */
  logo: string;
  /** One-line pitch. */
  pitch: string;
  /** Two to three concrete benefits. */
  benefits: readonly string[];
  /** Primary repo / site link. */
  href: string;
  /** Label for the primary link button. */
  hrefLabel: string;
};

/** Hero - the Rogue Oak name and master tagline (also the source for site.ts). */
export const hero = {
  name: "Rogue Oak",
  tagline: "Software built to last.",
} as const;

/** Copy for the 404 page - a lost visitor, pointed back home. */
export const notFound = {
  code: "404",
  heading: "Whoops, looks like you are lost!",
  body: "Even a rogue oak stands somewhere. This page does not. The path you followed leads nowhere, so let's get you back to solid ground.",
  cta: "Let's go home",
} as const;

/** The oak name story - two short paragraphs, shown as a quote. */
export const oakStory = {
  paragraphs: [
    "Oaks are among the strongest trees: majestic, long-lived, and built to stand the test of time. They usually gather in groves and savannahs, but sometimes a lone oak, a rogue oak, stands on its own in an open field, against the grain.",
    "Some white oaks grow for 300 years, live for 300 more, and take 300 to die. Across all that time the oak gives endless value to its whole ecosystem. Rogue Oak builds software the same way, with a relentless focus on value, experience, and quality that lasts.",
  ],
} as const;

export const projects: readonly Project[] = [
  {
    name: "Spectra",
    logo: "/spectra-logo.svg",
    pitch:
      "Spec-driven development with learning feedback loops. Installable into any repo in three commands.",
    benefits: [
      "An 8-step protocol loop: Route, Spec, Plan, Build, Test, Review, Merge, Reflect.",
      "Scoped review personas and a feedback-to-learnings loop, so the system gets better at your codebase over time.",
      "Low token cost, packaged for Claude Code, Codex, Gemini CLI, and Cursor.",
    ],
    href: "https://github.com/rogueoak/spectra",
    hrefLabel: "View Spectra",
  },
  {
    name: "Trellis",
    logo: "/trellis-logo.svg",
    pitch:
      "Shared conventions for the AI agents on every rogueoak repo. Install once, update in one command.",
    benefits: [
      "Shared rules in plain Markdown, with a commit-msg hook that enforces Conventional Commits.",
      "Opt-in templates that work across Claude Code, Codex, Gemini CLI, and Cursor.",
      "Every repo feels like one hand built it.",
    ],
    href: "https://github.com/rogueoak/trellis",
    hrefLabel: "View Trellis",
  },
  {
    name: "Canopy",
    logo: "/canopy-logo.svg",
    pitch:
      "An earthy, tree-themed design system for rogueoak, built on Radix, shadcn, Tailwind v4, and TypeScript.",
    benefits: [
      "A tree-anatomy model: Roots are tokens, then Seeds, Twigs, Branches, and Boughs.",
      "Semantic tokens as the source of truth, with light and dark theming for free at WCAG AA.",
      "Shipped as versioned npm packages under @rogueoak.",
    ],
    href: "https://github.com/rogueoak/canopy",
    hrefLabel: "View Canopy",
  },
] as const;

/**
 * A not-yet-shipped product, shown in the Coming Soon section. Same shape as a
 * Project, plus a short, honest development-status marker so it never reads as a
 * fourth shipped tool.
 */
export type Upcoming = Project & {
  /** Where the work stands today, e.g. "In early development". */
  status: string;
};

/**
 * Coming soon - early work, shown after the shipped projects and before the
 * subscribe box. Thought Stream is the first: a hands-free dictation app.
 */
export const comingSoon = {
  heading: "Coming soon",
  items: [
    {
      name: "Thought Stream",
      logo: "/thought-stream-logo.svg",
      status: "In early development",
      pitch:
        "Hands-free, on-device dictation for capturing your thinking out loud on iPhone and in CarPlay.",
      benefits: [
        "Tap once, ask Siri, or press Start in CarPlay, then just talk. Pause to think; the stream waits for you.",
        "Edit entirely by voice with a control word, so you never have to touch the screen.",
        "Speech-to-text runs on the device, so your words never leave your phone, and your thoughts stay yours as plain Markdown.",
      ],
      href: "https://github.com/rogueoak/thought-stream",
      hrefLabel: "View Thought Stream",
    },
  ] as readonly Upcoming[],
} as const;
