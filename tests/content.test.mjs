// Content data checks. The page copy lives in one typed module so it is
// reviewable and testable in one place. Node strips the TypeScript types at
// import (the module has no runtime imports), so we can assert on the real data.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  hero,
  nav,
  notFound,
  oakStory,
  home,
  about,
  toolsPage,
  productsPage,
  contact,
  tools,
  products,
} from "../src/lib/content.ts";

// Resolve a "/foo.svg" public path to its file on disk. A referenced asset that
// is not in public/ would 404 at runtime, so the tests fail the build instead.
function publicFileExists(publicPath) {
  return existsSync(fileURLToPath(new URL("../public" + publicPath, import.meta.url)));
}

// Em dash, en dash, and other non-ASCII: the language rules require ASCII only.
const NON_ASCII = /[^\x00-\x7F]/;
// Spaced-dash sentence break (" - "): the language rules retire it in favour of a
// colon, comma, or period. Guards the copy, not the comments (only strings here).
const SPACED_DASH = / - /;

function everyString(value) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(everyString);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(everyString);
  }
  return [];
}

// The copy objects (no functions), for the whole-copy sweeps below.
const ALL_COPY = {
  hero,
  nav,
  notFound,
  oakStory,
  home,
  about,
  toolsPage,
  productsPage,
  contact,
  tools,
  products,
};

/** Shared field checks for one tool or product record. */
function assertItemShape(item, { org }) {
  assert.match(item.slug, /^[a-z][a-z0-9-]*$/, "slug is a url-safe kebab string");
  assert.ok(item.name.trim(), "name is present");
  assert.match(item.logo, /^\/[\w-]+\.(svg|png)$/, "logo is a public asset path");
  assert.ok(
    publicFileExists(item.logo),
    `logo file is missing from public/: ${item.logo}`,
  );
  assert.ok(item.pitch.trim(), "pitch is a non-empty string");
  assert.ok(
    item.benefits.length >= 2 && item.benefits.length <= 3,
    "2-3 benefits",
  );
  for (const benefit of item.benefits) {
    assert.ok(benefit.trim(), "each benefit is a non-empty string");
  }
  assert.ok(item.body.length >= 1, "at least one body paragraph");
  for (const paragraph of item.body) {
    assert.ok(paragraph.trim(), "each body paragraph is a non-empty string");
  }
  assert.match(item.href, /^https:\/\//, "href is an https url");
  if (org) {
    assert.match(item.href, org, "href points at the expected origin");
  }
  assert.ok(item.hrefLabel.trim(), "hrefLabel is present");
}

test("there are exactly three tools, in order", () => {
  assert.deepEqual(
    tools.map((t) => t.name),
    ["Spectra", "Trellis", "Canopy"],
  );
});

test("each tool has the required fields and a rogueoak repo link", () => {
  for (const tool of tools) {
    assertItemShape(tool, { org: /^https:\/\/github\.com\/rogueoak\// });
    assert.equal(tool.status, undefined, "a shipped tool has no status marker");
  }
});

test("there are exactly two products, Thought Stream and Branch Out Games", () => {
  assert.deepEqual(
    products.map((p) => p.name),
    ["Thought Stream", "Branch Out Games"],
  );
});

test("each product has the required fields and a coming-soon status", () => {
  for (const product of products) {
    assertItemShape(product, { org: null });
    assert.ok(product.status && product.status.trim(), "carries a status marker");
  }
});

test("tool and product slugs are unique", () => {
  const slugs = [...tools, ...products].map((i) => i.slug);
  assert.equal(new Set(slugs).size, slugs.length, "no duplicate slugs");
});

test("the nav lists About, Tools, Products, Contact with hrefs", () => {
  assert.deepEqual(
    nav.map((link) => link.label),
    ["About", "Tools", "Products", "Contact"],
  );
  for (const link of nav) {
    assert.match(link.href, /^\/[a-z]+$/, "href is an absolute in-site path");
  }
});

test("home routes to the tools and products lists", () => {
  assert.ok(home.lead.trim(), "the pitch lead is present");
  assert.equal(home.cards.length, 2, "two routing cards");
  assert.deepEqual(
    home.cards.map((c) => c.href).sort(),
    ["/products", "/tools"],
  );
  for (const card of home.cards) {
    assert.ok(card.title.trim() && card.blurb.trim() && card.cta.trim());
  }
});

test("about carries an intro, a mission placeholder, and a story heading", () => {
  assert.ok(about.heading.trim(), "heading present");
  assert.ok(about.intro.trim(), "intro present");
  assert.ok(about.missionPending.trim(), "mission placeholder present");
  assert.ok(about.storyHeading.trim(), "story heading present");
});

test("the tools/products/contact pages have intros", () => {
  assert.ok(toolsPage.heading.trim() && toolsPage.intro.trim());
  assert.ok(productsPage.heading.trim() && productsPage.intro.trim());
  assert.ok(contact.heading.trim() && contact.intro.trim());
});

test("the oak story ties back to value and quality", () => {
  const joined = oakStory.paragraphs.join(" ");
  assert.match(joined, /300/, "mentions the 300-year longevity");
  assert.match(joined, /value/, "ties back to value");
  assert.match(joined, /quality/, "names quality as the through-line");
  assert.ok(oakStory.paragraphs.length >= 2, "at least two paragraphs");
});

test("the hero carries the master tagline", () => {
  assert.equal(hero.tagline, "Software built to last.");
});

test("no product/tool copy frames the work as standalone tools", () => {
  // The retired framing (spec 0010) is about how the PRODUCTS are pitched, so the
  // sweep is scoped to the sales copy and excludes the oak story, where "a lone
  // oak stands on its own" is the literal, intended image. Matches the singular
  // ("stands") too, which the old regex missed.
  const SALES_COPY = { home, toolsPage, productsPage, contact, tools, products };
  for (const value of everyString(SALES_COPY)) {
    assert.doesNotMatch(
      value,
      /stands? on (their|its) own|built to stand on/i,
      `retired "stand on their own" framing found in copy: ${JSON.stringify(value)}`,
    );
  }
});

test("the 404 copy points a lost visitor back home", () => {
  assert.equal(notFound.code, "404");
  assert.ok(notFound.heading.trim(), "heading is present");
  assert.ok(notFound.body.trim(), "body is present");
  assert.ok(notFound.cta.trim(), "cta label is present");
});

test("all copy is ASCII only (no em / en dash)", () => {
  for (const value of everyString(ALL_COPY)) {
    assert.ok(
      !NON_ASCII.test(value),
      `non-ASCII character found in copy: ${JSON.stringify(value)}`,
    );
  }
});

test("no copy uses a spaced-dash sentence break", () => {
  for (const value of everyString(ALL_COPY)) {
    assert.ok(
      !SPACED_DASH.test(value),
      `spaced-dash sentence break found in copy (use a colon/comma/period): ${JSON.stringify(value)}`,
    );
  }
});
