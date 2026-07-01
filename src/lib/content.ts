/**
 * Page copy in one reviewable, testable place. The voice follows the rogueoak
 * language rules: address the reader as "you", stay terse, no hype words, and
 * ASCII only (use spaced hyphens " - ", never em / en dashes). Every product is
 * described in confident present tense as a shipped tool.
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

/** Hero tagline - the Rogue Oak master line. */
export const hero = {
  wordmark: "/rogueoak-logo.svg",
  avatar: "/rogueoak-avatar.svg",
  name: "Rogue Oak",
  tagline: "Quietly rogue. Seriously solid.",
  intro:
    "Rogue Oak is Matthew Maynes building developer tools that hold up on their own. Three of them ship today.",
} as const;

/** The oak name story - two short paragraphs. */
export const oakStory = {
  heading: "The oak",
  paragraphs: [
    "Oaks are among the strongest trees - majestic, long-lived, and built to stand the test of time. They usually gather in groves and savannahs, but sometimes a lone oak, a rogue oak, stands on its own in an open field, against the grain.",
    "Some white oaks grow for 300 years, live for 300 more, and take 300 to die. Across all that time the oak gives endless value to a whole ecosystem. Rogue Oak aims to build incredible customer value the same way - slow to fell, steady to lean on.",
  ],
} as const;

export const projects: readonly Project[] = [
  {
    name: "Spectra",
    logo: "/spectra-logo.svg",
    pitch:
      "Spec-driven development with learning feedback loops - installable into any repo in three commands.",
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
      "An earthy, tree-themed design system for rogueoak - built on Radix, shadcn, Tailwind v4, and TypeScript.",
    benefits: [
      "A tree-anatomy model: Roots are tokens, then Seeds, Twigs, Branches, and Boughs.",
      "Semantic tokens as the source of truth, with light and dark theming for free at WCAG AA.",
      "Shipped as versioned npm packages under @rogueoak.",
    ],
    href: "https://github.com/rogueoak/canopy",
    hrefLabel: "View Canopy",
  },
] as const;
