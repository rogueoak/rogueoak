import type { CSSProperties, ElementType, ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Element to render as the wrapper. Defaults to a <div>. */
  as?: ElementType;
  className?: string;
  /** Stagger the entrance by this many milliseconds. */
  delay?: number;
};

/**
 * Reveal wrapper: a pure-CSS fade-up entrance (see `.reveal` in globals.css).
 *
 * No JavaScript on purpose. Scroll/observer-driven versions were unreliable
 * across environments; a plain CSS animation always plays and can never leave
 * content hidden. `prefers-reduced-motion` disables it. Pass `delay` to stagger a
 * group (e.g. the project blocks).
 */
export function Reveal({ children, as, className, delay }: RevealProps) {
  const Tag = as ?? "div";
  const classes = className ? `reveal ${className}` : "reveal";
  const style: CSSProperties | undefined = delay
    ? { animationDelay: `${delay}ms` }
    : undefined;

  return (
    <Tag className={classes} style={style}>
      {children}
    </Tag>
  );
}
