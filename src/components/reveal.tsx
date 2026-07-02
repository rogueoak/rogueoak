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
 * Content is ALWAYS visible by default (server HTML, no-JS, reduced-motion). When
 * motion is allowed, this hides only the elements still below the fold - never
 * anything on screen - and fades them in once they scroll up into view.
 *
 * The trigger is a plain scroll/resize listener (rAF-throttled), not an
 * IntersectionObserver: iOS Safari has not reliably fired the observer callback
 * here, whereas scroll events do. Because on-screen content is never hidden, the
 * page can never be blank even if the listener never runs.
 *
 * The below-the-fold check runs on mount and again after `window.load`, so
 * late-loading logo images that push content down are measured correctly.
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
    if (reducedMotion) return;

    let armed = false;
    let done = false;
    let raf = 0;

    // Reveal once the element's top has scrolled to within 85% of the viewport
    // height - far enough in that the fade is clearly visible.
    const inView = () => node.getBoundingClientRect().top < window.innerHeight * 0.85;

    const finish = () => {
      if (done) return;
      done = true;
      node.classList.remove("reveal-hidden");
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };

    const onScroll = () => {
      if (done || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (inView()) finish();
      });
    };

    const arm = () => {
      if (armed || done) return;
      // Leave anything already on screen visible - only hide what is below the fold.
      if (inView()) return;
      armed = true;
      node.classList.add("reveal-hidden");
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
    };

    arm();
    if (document.readyState !== "complete") {
      window.addEventListener("load", arm, { once: true });
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("load", arm);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const classes = className ? `reveal ${className}` : "reveal";
  return (
    <Tag ref={ref} className={classes}>
      {children}
    </Tag>
  );
}
