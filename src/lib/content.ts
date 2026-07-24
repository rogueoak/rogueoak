/**
 * Page copy in one reviewable, testable place. The voice follows the rogueoak
 * language rules: address the reader as "you", speak of the company in the third
 * person ("Rogue Oak", never "we"/"I"), stay terse, no hype words, ASCII only
 * (never em / en dashes), and avoid " - " as a sentence break (prefer a colon,
 * period, or comma). Shipped tools are described in confident present tense;
 * unshipped products carry an honest status marker.
 *
 * This module is import-free on purpose: `node --test` loads it directly to
 * assert on the copy, so it must not pull in path-aliased or extensionless
 * modules. It is the source of truth for the brand name and tagline - `site.ts`
 * derives its identity strings from `hero` here, rather than restating them, and
 * every page reads its title/description/records from here so metadata, the OG
 * cards, and the on-page copy can never drift.
 */

/**
 * One tool or product. Tools and products share a shape so the listing cards and
 * the detail pages render from a single component. `body` is the longer copy the
 * detail page adds under the pitch; `status` marks an unshipped product (a tool
 * never has one).
 */
export type Item = {
  /** URL segment under /tools or /products, e.g. "spectra". */
  slug: string;
  /** Product name as shown on the card and in metadata. */
  name: string;
  /** Public path to the wide product wordmark (served from public/). */
  logo: string;
  /** One-line pitch. */
  pitch: string;
  /** Two to three concrete benefits. */
  benefits: readonly string[];
  /** Longer copy for the detail page, one string per paragraph. */
  body: readonly string[];
  /** Primary repo / site link. */
  href: string;
  /** Label for the primary link button. */
  hrefLabel: string;
  /** Only on unshipped products, e.g. "Coming soon". */
  status?: string;
};

/** Hero - the Rogue Oak name and master tagline (also the source for site.ts). */
export const hero = {
  name: "Rogue Oak",
  tagline: "Software built to last.",
} as const;

/** Top-nav links, left to right. The brand mark (home) sits before these. */
export const nav = [
  { label: "About", href: "/about" },
  { label: "Tools", href: "/tools" },
  { label: "Products", href: "/products" },
  { label: "Contact", href: "/contact" },
] as const;

/** Copy for the 404 page - a lost visitor, pointed back home. */
export const notFound = {
  code: "404",
  heading: "Whoops, looks like you are lost!",
  body: "Even a rogue oak stands somewhere. This page does not. The path you followed leads nowhere, so let's get you back to solid ground.",
  cta: "Let's go home",
} as const;

/** The oak name story - two short paragraphs, shown as a quote on the About page. */
export const oakStory = {
  paragraphs: [
    "Oaks are among the strongest trees: majestic, long-lived, and built to stand the test of time. They usually gather in groves and savannahs, but sometimes a lone oak, a rogue oak, stands on its own in an open field, against the grain.",
    "Some white oaks grow for 300 years, live for 300 more, and take 300 to die. Across all that time the oak gives endless value to its whole ecosystem. Rogue Oak builds software the same way, with a relentless focus on value, experience, and quality that lasts.",
  ],
} as const;

/**
 * The Rogue Oak mission, stated plainly. Shared by the home pitch and the About
 * page (both read it from here) so the two can never drift.
 */
export const mission =
  "Rogue Oak builds what it believes in, not what would simply sell. It earns a relationship it is accountable for, not just your attention or your data. What is yours stays yours. That is not up for negotiation.";

/**
 * Home - the pitch. The mission up front, then two cards that route to the Tools
 * and Products lists. Kept lean: home states what Rogue Oak stands for and sends
 * you deeper; the About page carries the same mission plus the oak story.
 */
export const home = {
  lead: mission,
  cards: [
    {
      title: "Tools",
      blurb:
        "Open-source tools Rogue Oak builds and runs on every project: spec-driven development, shared agent conventions, and a design system.",
      href: "/tools",
      cta: "Explore the tools",
    },
    {
      title: "Products",
      blurb:
        "Apps in the works, built the same way as the tools and just as accountable to you.",
      href: "/products",
      cta: "See the products",
    },
  ],
} as const;

/**
 * About - the mission and the oak story. Leads with the shared `mission`, then the
 * oak name story as the "why we build this way".
 */
export const about = {
  heading: "About Rogue Oak",
  intro: mission,
  storyHeading: "Why the oak",
} as const;

/** Tools listing intro. */
export const toolsPage = {
  heading: "Tools",
  intro:
    "Open-source tools Rogue Oak builds and uses on every project. Each one is small, sharp, and installable in a few commands.",
} as const;

/** Products listing intro. */
export const productsPage = {
  heading: "Products",
  intro:
    "Apps Rogue Oak is building, the same careful way as the tools. Both are on the way.",
} as const;

/** Contact page copy. */
export const contact = {
  heading: "Contact",
  intro:
    "Have a question, an idea, or just want to say hello? Send a note and it lands straight in the Rogue Oak inbox. A reply comes back to the address you leave.",
} as const;

export const tools: readonly Item[] = [
  {
    slug: "spectra",
    name: "Spectra",
    logo: "/spectra-logo.svg",
    pitch:
      "Spec-driven development with learning feedback loops. Installable into any repo in three commands.",
    benefits: [
      "An 8-step protocol loop: Route, Spec, Plan, Build, Test, Review, Merge, Reflect.",
      "Scoped review personas and a feedback-to-learnings loop, so the system gets better at your codebase over time.",
      "Low token cost, packaged for Claude Code, Codex, Gemini CLI, and Cursor.",
    ],
    body: [
      "Every change routes to the right track first: a trivial fix ships direct, a feature gets a spec you approve before any code, a bug becomes a feedback note the system learns from. Nothing large is built without a plan you signed off on.",
      "Reviews are run by scoped personas, an engineer, a tester, an architect, a security reviewer, that only weigh in where they apply. What they find rolls back into the project's living docs, so the next change starts smarter than the last.",
    ],
    href: "https://github.com/rogueoak/spectra",
    hrefLabel: "View Spectra on GitHub",
  },
  {
    slug: "trellis",
    name: "Trellis",
    logo: "/trellis-logo.svg",
    pitch:
      "Shared conventions for the AI agents on every rogueoak repo. Install once, update in one command.",
    benefits: [
      "Shared rules in plain Markdown, with a commit-msg hook that enforces Conventional Commits.",
      "Opt-in templates that work across Claude Code, Codex, Gemini CLI, and Cursor.",
      "Every repo feels like one hand built it.",
    ],
    body: [
      "Trellis ships the rules an agent needs to work in a rogueoak repo: how to write and ship, how code is structured, and the voice for anything a user reads. Run the install once and a repo speaks the same language as every other.",
      "When the rules change, one command pulls the update. Trellis owns the files it ships and never touches the ones you added, so an update is safe to run any day.",
    ],
    href: "https://github.com/rogueoak/trellis",
    hrefLabel: "View Trellis on GitHub",
  },
  {
    slug: "canopy",
    name: "Canopy",
    logo: "/canopy-logo.svg",
    pitch:
      "An earthy, tree-themed design system for rogueoak, built on Radix, shadcn, Tailwind v4, and TypeScript.",
    benefits: [
      "A tree-anatomy model: Roots are tokens, then Seeds, Twigs, Branches, and Boughs.",
      "Semantic tokens as the source of truth, with light and dark theming for free at WCAG AA.",
      "Shipped as versioned npm packages under @rogueoak.",
    ],
    body: [
      "Canopy is organized like a tree. Roots are the design tokens; Seeds are the atoms; Twigs, Branches, and Boughs build up from there. Every component reads from semantic tokens, so a brand or a theme is a token change, not a component rewrite.",
      "It ships as versioned npm packages and powers this very site. Light and dark themes come for free at WCAG AA contrast, so accessibility is the default rather than an afterthought.",
    ],
    href: "https://github.com/rogueoak/canopy",
    hrefLabel: "View Canopy on GitHub",
  },
] as const;

export const products: readonly Item[] = [
  {
    slug: "thought-stream",
    name: "Thought Stream",
    logo: "/thought-stream-logo.svg",
    status: "Coming soon",
    pitch:
      "Hands-free, on-device dictation for capturing your thinking out loud on iPhone and in CarPlay.",
    benefits: [
      "Tap once, ask Siri, or press Start in CarPlay, then just talk. Pause to think; the stream waits for you.",
      "Edit entirely by voice with a control word, so you never have to touch the screen.",
      "Speech-to-text runs on the device, so your words never leave your phone, and your thoughts stay yours as plain Markdown.",
    ],
    body: [
      "Thought Stream is for the ideas that arrive when your hands are busy: driving, walking, cooking. Start a stream and talk. It waits through your pauses instead of cutting you off, so a long train of thought stays in one piece.",
      "Nothing leaves the phone. The speech-to-text runs on the device and your thoughts land as plain Markdown you own, ready to move anywhere. Still in early development.",
    ],
    href: "https://github.com/rogueoak/thought-stream",
    hrefLabel: "View Thought Stream on GitHub",
  },
  {
    slug: "branch-out",
    name: "Branch Out Games",
    logo: "/branchout-logo.svg",
    status: "Coming soon",
    pitch:
      "Online shared games for game night: mostly party games you play together, with a few for solo runs.",
    benefits: [
      "Get friends into a game in seconds, no installs, no fuss.",
      "Party games built to stay fair and social, so everyone keeps playing.",
      "A growing shelf of games under one subscription.",
    ],
    body: [
      "Branch Out Games is where game night grows: online shared games you play together, mostly party games with a few solo ones in the mix. Send a link, gather the group, and start playing in seconds.",
      "The games are built to stay fair and social, so no one gets left on the sidelines. Still on the way.",
    ],
    href: "https://branchout.games",
    hrefLabel: "Visit branchout.games",
  },
] as const;

/** Find a tool by its URL slug (used by the tool detail pages). */
export function toolBySlug(slug: string): Item | undefined {
  return tools.find((t) => t.slug === slug);
}

/** Find a product by its URL slug (used by the product detail pages). */
export function productBySlug(slug: string): Item | undefined {
  return products.find((p) => p.slug === slug);
}
