/**
 * JSON-LD structured-data builders (spec 0013). Search engines and answer engines
 * read schema.org markup to know what Rogue Oak is, what each tool and product is,
 * and how the pages relate. These builders return plain JSON-LD objects; the
 * `JsonLd` component serializes them into a script tag.
 *
 * Import-free on purpose (like `content.ts`): `node --test` loads it directly to
 * assert on the shapes. Callers pass the identity strings and item records in, so
 * nothing here reaches for `site.ts` / `content.ts` through a path alias. The
 * `@id` values are stable URL fragments the item nodes point back at, so a crawler
 * links a SoftwareApplication to its publisher without repeating the org.
 */

/** The subset of a content `Item` these builders read. */
export type SchemaItem = {
  name: string;
  pitch: string;
  href: string;
};

/** Site identity the org/website nodes describe. */
export type SchemaSite = {
  name: string;
  description: string;
  url: string;
  logo: string;
  sameAs: readonly string[];
};

/** Stable fragment ids so item nodes can reference the org/site without repeating them. */
export const ORG_ID = (url: string) => `${url}/#organization`;
export const SITE_ID = (url: string) => `${url}/#website`;

/** Organization node: who Rogue Oak is. Rendered once site-wide. */
export function organizationSchema(site: SchemaSite): object {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID(site.url),
    name: site.name,
    url: site.url,
    logo: new URL(site.logo, site.url).toString(),
    description: site.description,
    sameAs: [...site.sameAs],
  };
}

/** WebSite node: the site itself, published by the Organization. */
export function websiteSchema(site: SchemaSite): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SITE_ID(site.url),
    name: site.name,
    url: site.url,
    description: site.description,
    publisher: { "@id": ORG_ID(site.url) },
  };
}

/**
 * SoftwareApplication node for one tool or product. `category` is the schema.org
 * applicationCategory (e.g. "DeveloperApplication"); `pageUrl` is the canonical
 * page on this site; `publisherUrl` anchors the publisher `@id` to the org. No
 * price or availability is asserted: schema describes what the thing is, and an
 * unshipped product keeps its honest "coming soon" only in the visible copy.
 */
export function softwareApplicationSchema(
  item: SchemaItem,
  opts: { category: string; pageUrl: string; publisherUrl: string },
): object {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: item.name,
    description: item.pitch,
    applicationCategory: opts.category,
    url: opts.pageUrl,
    sameAs: item.href,
    publisher: { "@id": ORG_ID(opts.publisherUrl) },
  };
}

/** One crumb in a breadcrumb trail. */
export type Crumb = { name: string; url: string };

/** BreadcrumbList node: the Home > Section > Item trail for a detail page. */
export function breadcrumbSchema(crumbs: readonly Crumb[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}
