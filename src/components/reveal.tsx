"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Element to render as the wrapper. Defaults to a <div>. */
  as?: ElementType;
  className?: string;
};

/**
 * Scroll-reveal wrapper. Content is visible by default (SSR / no-JS / reduced
 * motion all render it plainly). Only when the browser can animate do we hide it
 * on mount and fade it in on first viewport entry.
 *
 * Robustness is the whole point here: content must NEVER get stuck hidden. So we
 * only hide elements that start below the fold, we reveal on IntersectionObserver
 * intersection, and a fallback timer reveals regardless if the observer never
 * fires (seen with flaky observer timing across browsers). The `.reveal` /
 * `.reveal.in-view` transition lives in globals.css.
 */
export function Reveal({ children, as, className }: RevealProps) {
  const Tag = as ?? "div";
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Leave content visible for reduced-motion users and where the observer is
    // unavailable - never hide what we cannot reliably bring back.
    const reducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || typeof IntersectionObserver === "undefined") return;

    // Already on screen at mount (e.g. the hero): never hide it, so there is no
    // fade-out-then-in flash.
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) return;

    node.classList.add("reveal");
    const reveal = () => node.classList.add("in-view");

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          reveal();
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px -80px 0px" },
    );
    observer.observe(node);

    // Safety net: if the observer has not fired shortly, reveal anyway so a block
    // can never be left invisible.
    const fallback = window.setTimeout(reveal, 1500);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <Tag ref={ref} className={className || undefined}>
      {children}
    </Tag>
  );
}
