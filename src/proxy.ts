import { NextResponse, type NextRequest } from "next/server";

/**
 * Host-based routing so one container serves both rogueoak.com and thoughtbuffer.app
 * (spec 0012). This is the ONLY host-aware code in the app: thoughtbuffer.app is
 * rewritten into the fixed `/thoughtbuffer` route subtree, which hardcodes its own
 * metadata / robots / sitemap, so nothing downstream has to derive a base URL from
 * the request host. The internal `/thoughtbuffer` prefix is never public.
 *
 * The proxy RE-RUNS on the rewrite it issues, and that internal sub-request carries
 * the server's own host (not thoughtbuffer.app), so host alone cannot tell an
 * internal rewrite from a real rogueoak.com/thoughtbuffer hit. The rewrite is tagged
 * with `x-tb-rewrite` and short-circuited on the second pass instead.
 *
 * The matcher runs on page routes plus robots.txt / sitemap.xml (so those can be
 * remapped per host) and skips Next internals (`_next`), the PostHog proxy
 * (`/ingest`), the shared versioned API (`/v1`), and static assets.
 */

const THOUGHT_BUFFER_HOSTS = new Set(["thoughtbuffer.app", "www.thoughtbuffer.app"]);
const PREFIX = "/thoughtbuffer";
const REWRITE_MARK = "x-tb-rewrite";

export function proxy(req: NextRequest): NextResponse {
  // Second pass: this request is our own rewrite landing on the subtree. Let it
  // resolve rather than re-rewriting or blocking the (now internal) prefix.
  if (req.headers.get(REWRITE_MARK)) return NextResponse.next();

  const host = (req.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const { pathname } = req.nextUrl;

  if (THOUGHT_BUFFER_HOSTS.has(host)) {
    // Its robots and sitemap live under the prefix; map the well-known files on.
    if (pathname === "/robots.txt" || pathname === "/sitemap.xml") {
      return rewrite(req, `${PREFIX}${pathname}`);
    }
    // Static/public assets (they carry a file extension) serve as-is; only page
    // routes fold into the subtree.
    if (/\.[^/]+$/.test(pathname)) return NextResponse.next();
    return rewrite(req, pathname === "/" ? PREFIX : `${PREFIX}${pathname}`);
  }

  // Any other host (rogueoak.com et al.): the internal prefix is not public.
  if (pathname === PREFIX || pathname.startsWith(`${PREFIX}/`)) {
    return new NextResponse("Not Found", { status: 404 });
  }
  return NextResponse.next();
}

function rewrite(req: NextRequest, pathname: string): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  const headers = new Headers(req.headers);
  headers.set(REWRITE_MARK, "1");
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  matcher: [
    "/((?!_next/|ingest/|v1/|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|woff|woff2|json|webmanifest)$).*)",
  ],
};
