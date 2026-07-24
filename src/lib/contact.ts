/**
 * Pure, I/O-free core for the contact endpoint: input validation, the on-brand
 * HTML notification rendering, and the Resend request shaping + send. Kept free of
 * Next / request objects and import-free so `node --test` loads it directly without
 * booting a server (the same node-testable-leaf rule as `subscribe.ts`; the
 * `app/v1/contact` route is a thin shell over this). No secrets or PII live here:
 * the destination + sender are read from env in the route and passed in. The
 * generic honeypot / same-origin / rate-limit guards live in `./http-guards.ts`
 * (shared with `/v1/subscribe`); this module owns only the contact-specific logic.
 * Mirrors matthewmaynes' contact core.
 */

export type ContactData = { name: string; email: string; message: string };
/** ContactData plus a human-readable received date, for the HTML notification. */
export type NotificationData = ContactData & { date: string };
export type ValidationResult =
  | { ok: true; data: ContactData }
  | { ok: false; error: string };
export type ResendPayload = {
  from: string;
  to: string;
  reply_to: string;
  subject: string;
  text: string;
  html: string;
};

/** Field length caps, so a payload can't be unbounded. */
export const LIMITS = { name: 100, email: 200, message: 5000 };

// Deliberately loose: one @, a dot in the domain, no whitespace. This gates
// obvious garbage, not RFC-perfect addresses - the reply proves it anyway.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate + normalize a raw submission. Trims strings, requires name/email/
 * message, checks a basic email shape, and enforces the length caps.
 */
export function validateContact(input: {
  name?: unknown;
  email?: unknown;
  message?: unknown;
}): ValidationResult {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";

  if (!name) return { ok: false, error: "Please enter your name." };
  if (name.length > LIMITS.name)
    return { ok: false, error: "That name is too long." };
  if (!email || email.length > LIMITS.email || !EMAIL_RE.test(email))
    return { ok: false, error: "Please enter a valid email address." };
  if (!message) return { ok: false, error: "Please enter a message." };
  if (message.length > LIMITS.message)
    return { ok: false, error: "That message is too long." };

  return { ok: true, data: { name, email, message } };
}

/**
 * Escape the five HTML-significant characters so a visitor's name/email/message
 * can never inject markup into the notification email. Applied to every value
 * before it is substituted into the HTML template.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// The placeholder tokens the notification template exposes (repo `[[...]]`
// convention). Substituted in a single pass, so an escaped value that happens to
// look like a token is never re-scanned.
const NOTIFICATION_TOKENS = /\[\[(NAME|EMAIL|MESSAGE|DATE)\]\]/g;

/**
 * Render the on-brand HTML notification: HTML-escape each field, turn the
 * message's newlines into `<br>` (so line breaks survive in the email), and
 * substitute the `[[NAME]]`/`[[EMAIL]]`/`[[MESSAGE]]`/`[[DATE]]` placeholders. The
 * template string is read from `emails/templates/contact-notification.html` by the
 * route and passed in, keeping this function pure and unit-testable.
 */
export function renderContactNotification(
  template: string,
  data: NotificationData,
): string {
  const values: Record<string, string> = {
    "[[NAME]]": escapeHtml(data.name),
    "[[EMAIL]]": escapeHtml(data.email),
    "[[MESSAGE]]": escapeHtml(data.message).replace(/\r?\n/g, "<br>"),
    "[[DATE]]": escapeHtml(data.date),
  };
  return template.replace(NOTIFICATION_TOKENS, (token) => values[token] ?? token);
}

/** Collapse runs of control characters to a single space and trim. */
function singleLine(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]+/g, " ").trim();
}

/**
 * Shape a validated submission into a Resend `POST /emails` body. The visitor's
 * address is the `reply_to`, so replying in the inbox reaches them; the private
 * destination (`to`) and verified sender (`from`) are supplied by the caller from
 * env and never hard-coded here. `html` is the rendered notification; `text` is a
 * plaintext fallback for clients (and deliverability) that prefer it.
 */
export function buildResendPayload({
  name,
  email,
  message,
  to,
  from,
  html,
}: ContactData & { to: string; from: string; html: string }): ResendPayload {
  return {
    from,
    to,
    reply_to: email,
    // Collapse control chars (incl. CR/LF) in the single-line subject so a
    // crafted name can't smuggle structure into it - defense in depth; Resend's
    // JSON API already escapes values and builds the MIME headers itself.
    subject: `Rogue Oak contact: ${singleLine(name)}`,
    text: `From: ${name} <${email}>\n\n${message}`,
    html,
  };
}

/**
 * POST the message to Resend. Throws on a non-2xx so the route returns a generic
 * 500. `fetchImpl` is injectable so the send path is unit-tested without a real
 * network call. The upstream call is time-bounded so a stalled Resend can't hang
 * the request.
 */
export async function sendViaResend(
  payload: ResendPayload,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  const res = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend responded ${res.status}: ${detail.slice(0, 200)}`);
  }
  return res;
}

/**
 * Whether a contact submission opted in to the mailing list. STRICT boolean: the
 * form sends a real `true` only when the box is ticked, so anything else (a bot's
 * `"on"` / `1` / `"true"`, or absence) is NOT a subscribe. Extracted as a pure leaf
 * so the enrol/skip gate is unit-tested rather than living only in the route - a
 * regression to a truthy `if (input.subscribe)` would silently enrol on `"on"`
 * (learnings: keep regression-prone route decisions in a node-testable leaf).
 */
export function shouldContactSubscribe(value: unknown): boolean {
  return value === true;
}
