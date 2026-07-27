// Unit tests for the JSON-LD builders (src/lib/structured-data.ts). The builders
// return plain objects, so their shapes are provable without a DOM. The JsonLd
// component only serializes what these return.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  organizationSchema,
  websiteSchema,
  softwareApplicationSchema,
  breadcrumbSchema,
  serializeJsonLd,
  ORG_ID,
  SITE_ID,
} from "../src/lib/structured-data.ts";

const SITE = {
  name: "Rogue Oak",
  description: "Software built to last.",
  url: "https://rogueoak.com",
  logo: "/rogueoak-logo.svg",
  sameAs: ["https://github.com/rogueoak", "https://matthewmaynes.com"],
};

test("organizationSchema has the Organization type, stable @id, and absolute logo", () => {
  const org = organizationSchema(SITE);
  assert.equal(org["@type"], "Organization");
  assert.equal(org["@id"], "https://rogueoak.com/#organization");
  assert.equal(org["@id"], ORG_ID(SITE.url));
  assert.equal(org.logo, "https://rogueoak.com/rogueoak-logo.svg");
  assert.deepEqual(org.sameAs, SITE.sameAs);
});

test("websiteSchema is published by the organization @id", () => {
  const web = websiteSchema(SITE);
  assert.equal(web["@type"], "WebSite");
  assert.equal(web["@id"], SITE_ID(SITE.url));
  assert.deepEqual(web.publisher, { "@id": ORG_ID(SITE.url) });
});

test("softwareApplicationSchema maps an item and links its publisher", () => {
  const item = { name: "Spectra", pitch: "Spec-driven development.", href: "https://github.com/rogueoak/spectra" };
  const app = softwareApplicationSchema(item, {
    category: "DeveloperApplication",
    pageUrl: "https://rogueoak.com/tools/spectra",
    publisherUrl: SITE.url,
  });
  assert.equal(app["@type"], "SoftwareApplication");
  assert.equal(app.name, "Spectra");
  assert.equal(app.description, "Spec-driven development.");
  assert.equal(app.applicationCategory, "DeveloperApplication");
  assert.equal(app.url, "https://rogueoak.com/tools/spectra");
  assert.equal(app.sameAs, "https://github.com/rogueoak/spectra");
  assert.deepEqual(app.publisher, { "@id": ORG_ID(SITE.url) });
});

test("softwareApplicationSchema asserts no price or availability", () => {
  const app = softwareApplicationSchema(
    { name: "Thought Buffer", pitch: "On-device dictation.", href: "https://thoughtbuffer.app" },
    { category: "MobileApplication", pageUrl: "https://rogueoak.com/products/thought-buffer", publisherUrl: SITE.url },
  );
  assert.equal(app.offers, undefined);
  assert.equal(app.price, undefined);
});

test("serializeJsonLd escapes every < so no script-breakout survives", () => {
  // A payload carrying each of the three breakout sequences; all start with '<'.
  const out = serializeJsonLd({ a: "</script>", b: "<!--", c: "<![CDATA[" });
  assert.ok(!out.includes("<"), "a raw < leaked into the serialized JSON-LD");
  assert.ok(out.includes("\\u003c/script>"), "</script> was not escaped");
  assert.ok(out.includes("\\u003c!--"));
  assert.ok(out.includes("\\u003c![CDATA["));
});

test("serializeJsonLd round-trips to the original data once unescaped", () => {
  const data = [{ "@type": "Thing", name: "a < b" }];
  const out = serializeJsonLd(data);
  // The escape is reversible: a JSON parser reads < back as '<'.
  assert.deepEqual(JSON.parse(out), data);
});

test("breadcrumbSchema numbers crumbs from 1 in order", () => {
  const crumbs = [
    { name: "Rogue Oak", url: "https://rogueoak.com/" },
    { name: "Tools", url: "https://rogueoak.com/tools" },
    { name: "Spectra", url: "https://rogueoak.com/tools/spectra" },
  ];
  const bc = breadcrumbSchema(crumbs);
  assert.equal(bc["@type"], "BreadcrumbList");
  assert.equal(bc.itemListElement.length, 3);
  bc.itemListElement.forEach((el, i) => {
    assert.equal(el["@type"], "ListItem");
    assert.equal(el.position, i + 1);
    assert.equal(el.name, crumbs[i].name);
    assert.equal(el.item, crumbs[i].url);
  });
});
