/**
 * Theme resolution - the single source of truth for "is dark active?".
 *
 * Typed TS (not TSX) so it can be both imported by the pre-paint <script> in
 * `theme-script.tsx` AND unit-tested directly (Node strips the types on import).
 * The inline source and `resolveDark` deliberately encode the SAME rule.
 */

/**
 * Resolve whether dark mode should be active. Explicit stored choice wins;
 * otherwise fall back to the OS preference.
 *
 * @param stored - localStorage 'theme' value
 * @param prefersDark - matchMedia('(prefers-color-scheme: dark)').matches
 */
export function resolveDark(
  stored: string | null | undefined,
  prefersDark: boolean,
): boolean {
  return stored ? stored === "dark" : prefersDark;
}

/**
 * The pre-paint IIFE injected into <head>. Runs before first paint, dependency-
 * free, and applies `.dark` on <html> using the same rule as `resolveDark`.
 * Wrapped in try/catch so a privacy mode that throws on localStorage never blocks
 * paint.
 */
export const themeScriptSource =
  "(function(){try{var s=localStorage.getItem('theme');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();";
