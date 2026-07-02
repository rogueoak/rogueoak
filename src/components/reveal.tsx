"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Element to render as the wrapper. Defaults to a <div>. */
  as?: ElementType;
  className?: string;
};

/**
 * Scroll-reveal wrapper. The element ships with the `.reveal` class in the
 * server HTML; an inline script in the document head adds `reveal-enabled` to
 * <html> before first paint (only when JS is on and motion is allowed), so the
 * hidden state is applied pre-paint with no flash and no layout measurement.
 * This effect just observes the element and adds `.in-view` the first time it
 * enters the viewport, which fades and rises it in (see globals.css).
 *
 * No-JS, reduced-motion, and browsers without IntersectionObserver all leave the
 * content fully visible - it can never get stuck hidden.
 */
export function Reveal({ children, as, className }: RevealProps) {
  const Tag = as ?? "div";
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      node.classList.add("in-view");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          node.classList.add("in-view");
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  const classes = className ? `reveal ${className}` : "reveal";
  return (
    <Tag ref={ref} className={classes}>
      {children}
    </Tag>
  );
}
