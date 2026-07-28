// Unit tests for the llms.txt renderer (src/lib/llms.ts) and its integration with
// the content model. The app/llms.txt route handler is a thin shell that assembles
// a document from content.ts / site.ts and hands it to renderLlmsTxt, so proving the
// renderer + the content wiring here covers the file.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  renderLlmsTxt,
  buildSiteLlmsDoc,
  itemNote,
} from "../src/lib/llms.ts";
import { tools, products, mission } from "../src/lib/content.ts";

const sampleDoc = {
  title: "Rogue Oak",
  summary: "Software built to last.",
  details: ["First paragraph.", "Second paragraph."],
  sections: [
    {
      title: "Tools",
      links: [
        { title: "Spectra", url: "https://rogueoak.com/tools/spectra", note: "Spec-driven." },
        { title: "Bare", url: "https://rogueoak.com/tools/bare" },
      ],
    },
  ],
};

test("renders the H1 title and blockquote summary", () => {
  const out = renderLlmsTxt(sampleDoc);
  assert.match(out, /^# Rogue Oak\n/);
  assert.match(out, /\n> Software built to last\.\n/);
});

test("includes each detail paragraph as its own block", () => {
  const out = renderLlmsTxt(sampleDoc);
  assert.ok(out.includes("First paragraph."));
  assert.ok(out.includes("Second paragraph."));
});

test("renders a section heading and its link lines", () => {
  const out = renderLlmsTxt(sampleDoc);
  assert.ok(out.includes("## Tools"));
  assert.ok(out.includes("- [Spectra](https://rogueoak.com/tools/spectra): Spec-driven."));
});

test("a link with no note has no trailing colon", () => {
  const out = renderLlmsTxt(sampleDoc);
  assert.ok(out.includes("- [Bare](https://rogueoak.com/tools/bare)\n"));
  assert.ok(!out.includes("tools/bare):"));
});

test("output ends with a single trailing newline", () => {
  const out = renderLlmsTxt(sampleDoc);
  assert.ok(out.endsWith("\n"));
  assert.ok(!out.endsWith("\n\n"));
});

test("blocks are separated by a blank line", () => {
  const out = renderLlmsTxt(sampleDoc);
  assert.ok(out.includes("# Rogue Oak\n\n> Software built to last."));
});

// --- renderLlmsTxt boundary cases -------------------------------------------

test("a section with no links renders as a bare heading", () => {
  const out = renderLlmsTxt({ title: "T", summary: "S", sections: [{ title: "Empty", links: [] }] });
  assert.ok(out.includes("## Empty"));
  // No stray link bullets, and the trailing newline is still single.
  assert.ok(!out.includes("- ["));
  assert.ok(out.endsWith("## Empty\n"));
});

test("omitted details render no detail block; empty details is the same as omitted", () => {
  const omitted = renderLlmsTxt({ title: "T", summary: "S", sections: [] });
  const empty = renderLlmsTxt({ title: "T", summary: "S", details: [], sections: [] });
  assert.equal(omitted, "# T\n\n> S\n");
  assert.equal(empty, omitted);
});

test("an empty summary still renders the blockquote marker", () => {
  const out = renderLlmsTxt({ title: "T", summary: "", sections: [] });
  assert.ok(out.includes("\n> \n") || out.startsWith("# T\n\n> \n"));
});

// --- buildSiteLlmsDoc (the rogueoak.com assembly the route handler runs) -----

test("buildSiteLlmsDoc includes every tool and product with a canonical link", () => {
  const doc = buildSiteLlmsDoc({
    name: "Rogue Oak",
    title: "Software built to last.",
    description: "desc.",
    mission,
    base: "https://rogueoak.com",
    tools,
    products,
    pages: [{ title: "About", path: "/about", note: "about." }],
  });
  const out = renderLlmsTxt(doc);
  assert.ok(out.includes("> Software built to last. desc."), "summary should join title + description");
  for (const tool of tools) {
    assert.ok(out.includes(`- [${tool.name}](https://rogueoak.com/tools/${tool.slug}): ${tool.pitch}`));
  }
  for (const product of products) {
    assert.ok(out.includes(`https://rogueoak.com/products/${product.slug}`), `missing ${product.slug}`);
  }
  assert.ok(out.includes("- [About](https://rogueoak.com/about): about."));
});

test("buildSiteLlmsDoc appends a coming-soon product's status to its note", () => {
  // Every current product is unshipped, so the (status) suffix must show.
  const doc = buildSiteLlmsDoc({
    name: "Rogue Oak",
    title: "t",
    description: "d",
    mission,
    base: "https://rogueoak.com",
    tools: [],
    products,
    pages: [],
  });
  const out = renderLlmsTxt(doc);
  for (const product of products.filter((p) => p.status)) {
    assert.ok(out.includes(`${product.pitch} (${product.status})`), `missing status for ${product.slug}`);
  }
});

test("itemNote appends status only when present", () => {
  assert.equal(itemNote({ pitch: "P" }), "P");
  assert.equal(itemNote({ pitch: "P", status: "Coming soon" }), "P (Coming soon)");
});

// --- language rules ----------------------------------------------------------

test("the assembled rogueoak.com doc is ASCII-only with no spaced-dash breaks", () => {
  const out = renderLlmsTxt(
    buildSiteLlmsDoc({
      name: "Rogue Oak",
      title: "Software built to last.",
      description: mission,
      mission,
      base: "https://rogueoak.com",
      tools,
      products,
      pages: [],
    }),
  );
  assert.ok(!/[^\x00-\x7F]/.test(out), "found a non-ASCII character in llms.txt output");
  assert.ok(!out.includes(" - "), "found a spaced-dash sentence break (docs/rules/language.md)");
});

test("the spaced-dash assertion has teeth (a ' - ' note is caught)", () => {
  const out = renderLlmsTxt({
    title: "T",
    summary: "S",
    sections: [{ title: "X", links: [{ title: "L", url: "u", note: "a - b" }] }],
  });
  assert.ok(out.includes(" - "), "sanity: the guard must be able to see a spaced dash");
});
