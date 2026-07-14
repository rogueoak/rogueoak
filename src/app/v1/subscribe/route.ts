import { NextResponse } from "next/server";
import {
  clientIpFromForwardedFor,
  createRateLimiter,
  isBodyWithinLimit,
  isHoneypotFilled,
  isSameOrigin,
} from "@/lib/http-guards";
import {
  createTokenCache,
  isTestEmail,
  submitSubscription,
  validateSubscribe,
} from "@/lib/subscribe";

/**
 * `POST /v1/subscribe` - adds a visitor's email to the "Rogue Oak" list in
 * Constant Contact, without ever exposing the OAuth credentials to the client.
 * The `/v1/` prefix versions the contract. All the logic lives in the pure,
 * unit-tested `@/lib/subscribe` (+ shared guards in `@/lib/http-guards`); this
 * handler only bridges the HTTP request to it, reads server-only secrets, and maps
 * outcomes to status codes. Other methods 405 automatically (only POST is
 * exported). Mirrors matthewmaynes' route, trimmed to Rogue Oak's single list.
 */

// Best-effort per-IP limiter, module-scoped so it persists across requests in the
// one long-lived server process: 5 subscribes / 10 min per IP.
const limiter = createRateLimiter({ max: 5, windowMs: 10 * 60 * 1000 });

// Module-scoped access-token cache: mint a 24h Constant Contact token once and
// reuse it across requests until shortly before expiry. Persists for the life of
// the process; a deploy/restart just re-mints.
const tokenCache = createTokenCache();

// Reject bodies larger than this before parsing. The payload is a single email
// (cap 200 chars) plus an optional name and the honeypot, so this is generous
// headroom yet bounds the parse.
const MAX_BODY_BYTES = 8 * 1024;

export async function POST(req: Request): Promise<Response> {
  // 1. Same-origin: this endpoint is public, so reject cross-origin drive-bys.
  if (
    !isSameOrigin(
      req.headers.get("origin"),
      req.headers.get("referer"),
      req.headers.get("host"),
    )
  ) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  // 2. Read the body as text and bound it on ACTUAL bytes, not the client-declared
  //    Content-Length (which can be absent or spoofed, e.g. a chunked transfer).
  //    `req.text()` is still backstopped by the platform's own body limit; this cap
  //    is the app-level guard. Over the cap => 413 before we parse.
  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  if (!isBodyWithinLimit(Buffer.byteLength(raw, "utf8"), MAX_BODY_BYTES)) {
    return NextResponse.json(
      { ok: false, error: "Request too large." },
      { status: 413 },
    );
  }

  // 3. Parse the JSON body (malformed / empty => 400).
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const input = (typeof body === "object" && body !== null ? body : {}) as Record<
    string,
    unknown
  >;

  // 4. Honeypot: a filled hidden field means a bot - drop silently, report 200 so
  //    it learns nothing.
  if (isHoneypotFilled(input.company)) {
    return NextResponse.json({ ok: true });
  }

  // 5. Validate + normalize.
  const result = validateSubscribe(input);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  // 5b. Internal test domain (@rogueoak.com): simulate a successful subscribe
  //     WITHOUT writing to Constant Contact, so the owner can exercise the full
  //     form UX (submit -> success note -> analytics) without creating throwaway
  //     contacts or firing a live welcome email. Returns the same { ok: true } as a
  //     real signup, so the client shows the identical success state. Deliberately
  //     BEFORE the rate limiter so the flow can be tested back to back, and before
  //     any env/network work so it also works when the CTCT secrets are not
  //     configured locally.
  if (isTestEmail(result.data.email)) {
    return NextResponse.json({ ok: true });
  }

  // 6. Rate limit, keyed on the real client IP. Counts every valid, same-origin
  //    attempt that reaches here (honeypot/invalid requests returned earlier).
  if (!limiter.check(clientIpFromForwardedFor(req.headers.get("x-forwarded-for")))) {
    return NextResponse.json(
      { ok: false, error: "Too many requests - please try again shortly." },
      { status: 429 },
    );
  }

  // 7. Config from server-only env. Missing => fail closed, never leak which.
  const clientId = process.env.CTCT_CLIENT_ID;
  const refreshToken = process.env.CTCT_REFRESH_TOKEN;
  const listId = process.env.CTCT_LIST_ID;
  if (!clientId || !refreshToken || !listId) {
    console.error(
      "subscribe: CTCT_CLIENT_ID, CTCT_REFRESH_TOKEN and/or CTCT_LIST_ID are not set; cannot subscribe.",
    );
    return NextResponse.json(
      { ok: false, error: "Sorry, subscribing is unavailable right now." },
      { status: 500 },
    );
  }

  // 8. Submit to Constant Contact (refresh-cached token -> sign_up_form). The
  //    optional name is split into first/last name in the lib.
  try {
    await submitSubscription(
      {
        email: result.data.email,
        name: result.data.name,
        clientId,
        refreshToken,
        listIds: [listId],
      },
      { cache: tokenCache },
    );
  } catch (err) {
    console.error("subscribe: Constant Contact submission failed:", err);
    return NextResponse.json(
      { ok: false, error: "Sorry, subscribing failed. Please try again later." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
