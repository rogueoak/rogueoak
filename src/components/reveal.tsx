"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Element to render as the wrapper. Defaults to a <div>. */
  as?: ElementType;
  className?: string;
};

/**
 * Scroll-reveal wrapper.
 *
 * Safety first: content is ALWAYS visible by default (server HTML, no-JS,
 * reduced-motion, and browsers without IntersectionObserver all render it
 * plainly). The only thing this does is, after the page has fully loaded, hide
 * the elements that are still BELOW the fold - never anything already on screen -
 * and fade them in as they scroll into view. Because we never hide what the
 * visitor can see, the page can never end up blank.
 *
 * The hide decision waits for `window.load` so the logo images are laid out and
 * the below-fold measurement is accurate (measuring too early made short mobile
 * pages think everything was on screen).
 */
export function Reveal({ children, as, className }: RevealProps) {
  const Tag = as ?? "div";
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || typeof IntersectionObserver === "undefined") return;

    let observer: IntersectionObserver | undefined;

    const setup = () => {
      // Only hide elements the visitor cannot currently see; leave everything
      // on screen (or above it) visible, so nothing ever gets stuck hidden.
      if (node.getBoundingClientRect().top < window.innerHeight) return;

      node.classList.add("reveal-hidden");
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            node.classList.remove("reveal-hidden");
            observer?.disconnect();
          }
        },
        { threshold: 0, rootMargin: "0px 0px -10% 0px" },
      );
      observer.observe(node);
    };

    if (document.readyState === "complete") {
      setup();
    } else {
      window.addEventListener("load", setup, { once: true });
    }

    return () => {
      window.removeEventListener("load", setup);
      observer?.disconnect();
    };
  }, []);

  const classes = className ? `reveal ${className}` : "reveal";
  return (
    <Tag ref={ref} className={classes}>
      {children}
    </Tag>
  );
}
