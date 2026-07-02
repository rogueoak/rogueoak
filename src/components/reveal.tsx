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
 * Only elements that start below the fold are hidden, and they fade in on first
 * viewport entry via IntersectionObserver (supported in every target browser).
 * Elements already on screen at mount stay visible, so there is no flash. The
 * fade transition lives on `.reveal.in-view` in globals.css.
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

    // Below the fold: hide now (instantly - the transition lives on `.in-view`),
    // then fade in when it scrolls into view.
    node.classList.add("reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          node.classList.add("in-view");
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={className || undefined}>
      {children}
    </Tag>
  );
}
