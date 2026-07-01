"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Element to render as the wrapper. Defaults to a <div>. */
  as?: ElementType;
  className?: string;
  /** Extra delay (ms) before the reveal transition starts, for a light stagger. */
  delay?: number;
};

/**
 * Scroll-reveal wrapper. Dependency-free: an IntersectionObserver adds the
 * `in-view` class the first time the element enters the viewport, then unobserves
 * so each element animates once. The fade + upward translate lives in
 * globals.css (`.reveal` / `.reveal.in-view`).
 *
 * Progressive enhancement: the pre-animation (hidden) `.reveal` class is added by
 * the client effect, never during render. Server HTML - and any visitor with JS
 * disabled - renders the content fully visible. Under prefers-reduced-motion the
 * CSS keeps the content visible with no transition, so the observer is harmless.
 * The class is toggled on the DOM node directly (not via React state) so the
 * effect stays a pure external-DOM sync with no cascading renders.
 */
export function Reveal({ children, as, className, delay }: RevealProps) {
  const Tag = as ?? "div";
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Apply the hidden pre-animation state now, on the client only, so the SSR /
    // no-JS render stays visible.
    node.classList.add("reveal");
    if (delay) node.style.transitionDelay = `${delay}ms`;

    const reveal = () => node.classList.add("in-view");

    // If the browser cannot observe, reveal immediately so nothing is trapped
    // hidden.
    if (typeof IntersectionObserver === "undefined") {
      reveal();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            reveal();
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <Tag ref={ref} className={className || undefined}>
      {children}
    </Tag>
  );
}
