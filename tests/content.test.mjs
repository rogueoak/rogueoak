// Content data checks. The page copy lives in one typed module so it is
// reviewable and testable in one place. Node strips the TypeScript types at
// import (the module has no runtime imports), so we can assert on the real data.

import { test } from "node:test";
import assert from "node:assert/strict";
import { hero, oakStory, projects } from "../src/lib/content.ts";

// Em dash, en dash, and other non-ASCII: the language rules require ASCII only
// with spaced hyphens " - ". This catches a stray Unicode dash slipping into copy.
const NON_ASCII = /[^\x00-\x7F]/;

function everyString(value) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(everyString);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(everyString);
  }
  return [];
}

test("there are exactly three projects", () => {
  assert.equal(projects.length, 3);
  assert.deepEqual(
    projects.map((p) => p.name),
    ["Spectra", "Trellis", "Canopy"],
  );
});

test("each project has the required fields", () => {
  for (const project of projects) {
    assert.ok(project.name, "name is present");
    assert.match(project.logo, /^\/[\w-]+\.svg$/, "logo is a public svg path");
    assert.ok(project.pitch.length > 0, "pitch is present");
    assert.ok(
      project.benefits.length >= 2 && project.benefits.length <= 3,
      "2-3 benefits",
    );
    assert.match(
      project.href,
      /^https:\/\/github\.com\/rogueoak\//,
      "href points at the rogueoak org",
    );
    assert.ok(project.hrefLabel.length > 0, "hrefLabel is present");
  }
});

test("the oak story ties back to customer value", () => {
  const joined = oakStory.paragraphs.join(" ");
  assert.match(joined, /300/, "mentions the 300-year longevity");
  assert.match(joined, /customer value/, "ties back to customer value");
  assert.ok(oakStory.paragraphs.length >= 2, "at least two paragraphs");
});

test("the hero carries the master tagline", () => {
  assert.equal(hero.tagline, "Quietly rogue. Seriously solid.");
});

test("all copy is ASCII only (no em / en dash)", () => {
  for (const value of everyString({ hero, oakStory, projects })) {
    assert.ok(
      !NON_ASCII.test(value),
      `non-ASCII character found in copy: ${JSON.stringify(value)}`,
    );
  }
});
