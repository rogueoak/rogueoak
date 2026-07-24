"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  TopNav,
  TopNavActions,
  TopNavBrand,
  TopNavLink,
  TopNavLinks,
  TopNavMenuButton,
} from "@/components/ui";
import { nav } from "@/lib/content";
import { site } from "@/lib/site";

/**
 * Site navigation: the Canopy `TopNav` (Branch) with the Rogue Oak mark linking
 * home and the four section links. A `"use client"` island because the active
 * link is derived from the current path via `usePathname`; TopNav owns the mobile
 * disclosure (menu button, Esc / outside-click, focus return) itself. Canopy parts
 * cross the client boundary through `@/components/ui` (see overview/architecture).
 *
 * A link is active on its own route and any child route, so `/tools/spectra`
 * still highlights Tools. Home has no link of its own: the brand mark is home.
 */
export function SiteNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <TopNav ariaLabel="Main" className="sticky top-0 z-50">
      <TopNavBrand asChild>
        <Link href="/" aria-label={site.name} className="flex items-center gap-2">
          <Image
            src="/rogueoak-avatar.svg"
            alt=""
            width={32}
            height={32}
            className="size-8 rounded-md"
            priority
          />
          <span className="font-semibold tracking-tight">{site.name}</span>
        </Link>
      </TopNavBrand>

      <TopNavLinks>
        {nav.map((link) => (
          <TopNavLink key={link.href} asChild active={isActive(link.href)}>
            <Link href={link.href}>{link.label}</Link>
          </TopNavLink>
        ))}
      </TopNavLinks>

      <TopNavActions>
        <TopNavMenuButton />
      </TopNavActions>
    </TopNav>
  );
}
