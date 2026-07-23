import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import {
  clientIpFromForwardedFor,
  createRateLimiter,
  isBodyWithinLimit,
  isHoneypotFilled,
  isSameOrigin,
} from "@/lib/http-guards";
import {
  buildResendPayload,
  renderContactNotification,
  sendViaResend,
  validateContact,
} from "@/lib/contact";
import { createTokenCache, submitSubscription } from "@/lib/subscribe";

/**
 * `POST /v1/contact` - relays a contact-form submission to the Rogue Oak inbox by
 * email (an on-brand HTML notification via Resend) without ever exposing the
 * destination address to the client, and - if the opt-in box was ticked - also
 * adds the sender to the "Rogue Oak" Constant Contact list. The `/v1/` prefix
 * versions the contract. The pure logic lives in the unit-tested `@/lib/contact`
 * (+ shared guards in `@/lib/http-guards`, + the subscribe core in
 * `@/lib/subscribe`); this handler bridges the HTTP request, reads server-only
 * secrets, and maps outcomes to status codes. Other methods 405 automatically.
 * Mirrors matthewmaynes' route, trimmed to Rogue Oak's single list.
 */

// Best-effort per-IP limiter, module-scoped so it persists across requests in the
// one long-lived server process: 5 sends / 10 min per IP.
const limiter = createRateLimiter({ max: 5, windowMs: 10 * 60 * 1000 });

// Module-scoped Constant Contact access-token cache, reused by the opt-in path.
const tokenCache = createTokenCache();

// The on-brand HTML notification body, read once at module load. It lives in
// `emails/templates/` (single source of truth, previewable); `next.config.ts`
// `outputFileTracingIncludes` copies it into the standalone/Docker runtime. A read
// failure falls back to a minimal body so a submission is never lost to a missing
// asset.
const NOTIFICATION_TEMPLATE = loadNotificationTemplate();

function loadNotificationTemplate(): string {
  try {
    return readFileSync(
      join(process.cwd(), "emails/templates/contact-notification.html"),
      "utf8",
    );
  } catch (err) {
    console.error(
      "contact: could not read contact-notification.html; using plain fallback:",
      err,
    );
    return "<p>[[NAME]] &lt;[[EMAIL]]&gt; wrote on [[DATE]]:</p><p>[[MESSAGE]]</p>";
  }
}

// Reject bodies larger than this before parsing. The message cap is 5000 chars;
// this leaves generous UTF-8 headroom for it plus the other fields yet bounds the
// parse.
const MAX_BODY_BYTES = 32 * 1024;

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
  //    Content-Length (absent/spoofable). Over the cap => 413 before we parse.
  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  if (!isBodyWithinLimit(Buffer.byteLength(raw, "utf8"), MAX_BODY_BYTES)) {
    return NextResponse.json(
      { ok: false, error: "Message too large." },
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
  const result = validateContact(input);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  // 6. Rate limit, keyed on the real client IP. Counts every valid, same-origin
  //    attempt that reaches here (honeypot/invalid requests returned earlier).
  if (!limiter.check(clientIpFromForwardedFor(req.headers.get("x-forwarded-for")))) {
    return NextResponse.json(
      { ok: false, error: "Too many messages - please try again shortly." },
      { status: 429 },
    );
  }

  // 7. Config from server-only env. Missing => fail closed, never leak which.
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from =
    process.env.CONTACT_FROM_EMAIL || "Rogue Oak <contact@rogueoak.com>";
  if (!apiKey || !to) {
    console.error(
      "contact: RESEND_API_KEY and/or CONTACT_TO_EMAIL are not set; cannot send.",
    );
    return NextResponse.json(
      { ok: false, error: "Sorry, sending is unavailable right now." },
      { status: 500 },
    );
  }

  // 8. Send the notification (primary action). Render the on-brand HTML body with
  //    the (escaped) form data, then hand it to Resend. A failure here 500s, since
  //    the visitor's message would otherwise be lost.
  const date = new Date().toLocaleString("en-CA", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Toronto",
  });
  const html = renderContactNotification(NOTIFICATION_TEMPLATE, {
    ...result.data,
    date,
  });
  try {
    await sendViaResend(buildResendPayload({ ...result.data, to, from, html }), apiKey);
  } catch (err) {
    console.error("contact: Resend send failed:", err);
    return NextResponse.json(
      { ok: false, error: "Sorry, sending failed. Please try again later." },
      { status: 500 },
    );
  }

  // 9. Opt-in only: if the box was ticked, also add the sender to the "Rogue Oak"
  //    list (sign_up_form, recording consent). BEST-EFFORT: the message already
  //    went out, so a Constant Contact failure is logged and swallowed rather than
  //    failing the request. Skipped cleanly when the CTCT env is unset.
  const clientId = process.env.CTCT_CLIENT_ID;
  const refreshToken = process.env.CTCT_REFRESH_TOKEN;
  const listId = process.env.CTCT_LIST_ID;
  if (input.subscribe === true && clientId && refreshToken && listId) {
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
      console.error("contact: Constant Contact subscribe failed (non-fatal):", err);
    }
  }

  return NextResponse.json({ ok: true });
}
