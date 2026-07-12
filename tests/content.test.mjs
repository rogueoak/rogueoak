// Content data checks. The page copy lives in one typed module so it is
// reviewable and testable in one place. Node strips the TypeScript types at
// import (the module has no runtime imports), so we can assert on the real data.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { hero, notFound, oakStory, projects } from "../src/lib/content.ts";

// Resolve a "/foo.svg" public path to its file on disk. A referenced asset that
// is not in public/ would 404 at runtime, so the tests fail the build instead.
function publicFileExists(publicPath) {
  return existsSync(fileURLToPath(new URL("../public" + publicPath, import.meta.url)));
}

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
    assert.ok(project.name.trim(), "name is present");
    assert.match(project.logo, /^\/[\w-]+\.svg$/, "logo is a public svg path");
    assert.ok(
      publicFileExists(project.logo),
      `logo file is missing from public/: ${project.logo}`,
    );
    assert.ok(project.pitch.trim(), "pitch is a non-empty string");
    assert.ok(
      project.benefits.length >= 2 && project.benefits.length <= 3,
      "2-3 benefits",
    );
    for (const benefit of project.benefits) {
      assert.ok(benefit.trim(), "each benefit is a non-empty string");
    }
    assert.match(
      project.href,
      /^https:\/\/github\.com\/rogueoak\//,
      "href points at the rogueoak org",
    );
    assert.ok(project.hrefLabel.trim(), "hrefLabel is present");
  }
});

test("the oak story ties back to customer value", () => {
  const joined = oakStory.paragraphs.join(" ");
  assert.match(joined, /300/, "mentions the 300-year longevity");
  assert.match(joined, /customer value/, "ties back to customer value");
  assert.ok(oakStory.paragraphs.length >= 2, "at least two paragraphs");
});

test("the hero carries the master tagline", () => {
  assert.equal(hero.tagline, "Tools built to stand on their own.");
});

test("the 404 copy points a lost visitor back home", () => {
  assert.equal(notFound.code, "404");
  assert.ok(notFound.heading.trim(), "heading is present");
  assert.ok(notFound.body.trim(), "body is present");
  assert.ok(notFound.cta.trim(), "cta label is present");
});

test("all copy is ASCII only (no em / en dash)", () => {
  for (const value of everyString({ hero, notFound, oakStory, projects })) {
    assert.ok(
      !NON_ASCII.test(value),
      `non-ASCII character found in copy: ${JSON.stringify(value)}`,
    );
  }
});
