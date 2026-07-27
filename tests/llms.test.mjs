// Unit tests for the llms.txt renderer (src/lib/llms.ts) and its integration with
// the content model. The route handlers (app/llms.txt, app/thoughtbuffer/llms.txt)
// are thin shells that assemble a document from content.ts / site.ts and hand it to
// renderLlmsTxt, so proving the renderer + the content wiring here covers the file.

import { test } from "node:test";
import assert from "node:assert/strict";
import { renderLlmsTxt } from "../src/lib/llms.ts";
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

test("every tool and product from content appears when the doc is built from it", () => {
  const url = (path) => `https://rogueoak.com${path}`;
  const out = renderLlmsTxt({
    title: "Rogue Oak",
    summary: "Software built to last.",
    details: [mission],
    sections: [
      {
        title: "Tools",
        links: tools.map((t) => ({ title: t.name, url: url(`/tools/${t.slug}`), note: t.pitch })),
      },
      {
        title: "Products",
        links: products.map((p) => ({ title: p.name, url: url(`/products/${p.slug}`), note: p.pitch })),
      },
    ],
  });

  for (const tool of tools) {
    assert.ok(out.includes(tool.name), `missing tool ${tool.name}`);
    assert.ok(out.includes(`/tools/${tool.slug}`), `missing link for ${tool.slug}`);
  }
  for (const product of products) {
    assert.ok(out.includes(product.name), `missing product ${product.name}`);
    assert.ok(out.includes(`/products/${product.slug}`), `missing link for ${product.slug}`);
  }
});

test("rendered output stays ASCII-only (language rules)", () => {
  const out = renderLlmsTxt({
    title: "Rogue Oak",
    summary: "Software built to last.",
    details: [mission],
    sections: [
      { title: "Tools", links: tools.map((t) => ({ title: t.name, url: "https://rogueoak.com", note: t.pitch })) },
    ],
  });
  assert.ok(!/[^\x00-\x7F]/.test(out), "found a non-ASCII character in llms.txt output");
});
