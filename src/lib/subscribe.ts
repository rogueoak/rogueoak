/**
 * Pure, I/O-free core for the subscribe endpoint (spec 0008): email validation,
 * the Constant Contact request shaping, the OAuth refresh-token -> access-token
 * exchange, the add-contact call, and a small in-memory access-token cache. Kept
 * free of Next / request objects so it is unit-tested without booting a server
 * (the `app/v1/subscribe` route handler is a thin shell over this - the same
 * testable-seam pattern used across the codebase). No secrets live here: the
 * Constant Contact client id, refresh token, and list id are read from env in the
 * route and passed in. `fetch` and `now` are injectable so the network and clock
 * are mocked in tests. The generic honeypot / same-origin / rate-limit guards live
 * in `./http-guards.ts` and are used directly by the route.
 *
 * Trimmed vs matthewmaynes (spec 0018): Rogue Oak has one list and no contact
 * form, so this carries only the opt-in `sign_up_form` path - there is no
 * "Website Contact" CRM record / unsubscribed-create path here.
 *
 * Import-free on purpose: `node --test` loads this module directly, so it must not
 * pull in path-aliased or extensionless modules (learnings: keep node-testable
 * modules leaf).
 */

export type SubscribeData = { email: string; name: string };
export type SubscribeValidation =
  | { ok: true; data: SubscribeData }
  | { ok: false; error: string };
export type NameParts = { firstName?: string; lastName?: string };

/** A Constant Contact `sign_up_form` request body. */
export type SignUpPayload = {
  email_address: string;
  create_source: "Contact";
  list_memberships: string[];
  first_name?: string;
  last_name?: string;
};

// Field length caps, so a payload can't be unbounded. `email`/`name` bound the
// raw inputs; `part` is the Constant Contact first_name/last_name field limit, so
// a split part never overflows the API.
export const SUBSCRIBE_LIMITS = { email: 200, name: 100, part: 50 };

// Cap a string to at most `n` Unicode code points (not UTF-16 units), so a hard
// slice can never split an astral character (e.g. an emoji or a rare CJK glyph)
// into a lone surrogate.
function capChars(str: string, n: number): string {
  const cp = Array.from(str);
  return cp.length > n ? cp.slice(0, n).join("") : str;
}

// Same deliberately-loose shape as matthewmaynes: one @, a dot in the domain, no
// whitespace. Gates obvious garbage, not RFC-perfect addresses.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Constant Contact v3 endpoints. The token endpoint is the device-flow app's
// public-client token exchange (no client secret); the sign_up_form endpoint is
// create-or-update, so a repeat email succeeds rather than erroring.
const TOKEN_URL = "https://authz.constantcontact.com/oauth2/default/v1/token";
const SIGNUP_URL = "https://api.cc.email/v3/contacts/sign_up_form";

// Refresh a bit before the token actually expires so an in-flight request never
// races the boundary and 401s.
const EXPIRY_SKEW_SEC = 60;

/**
 * Validate + normalize a raw submission. Trims the email, requires it, checks a
 * basic shape, and enforces the length cap. The `name` is OPTIONAL: trimmed and
 * length-capped, but never required - a missing/empty name still validates and
 * subscribes.
 */
export function validateSubscribe(input: {
  email?: unknown;
  name?: unknown;
}): SubscribeValidation {
  const email = typeof input.email === "string" ? input.email.trim() : "";
  if (!email || email.length > SUBSCRIBE_LIMITS.email || !EMAIL_RE.test(email))
    return { ok: false, error: "Please enter a valid email address." };
  const name =
    typeof input.name === "string"
      ? capChars(input.name.trim(), SUBSCRIBE_LIMITS.name)
      : "";
  return { ok: true, data: { email, name } };
}

// Domain reserved for exercising the subscribe UX end to end without touching
// Constant Contact. Any address AT this exact domain gets a simulated success in
// the route (see `isTestEmail`), so the owner can walk the real form - submit,
// success note, analytics - repeatedly without creating throwaway contacts or
// firing a live welcome email.
export const TEST_EMAIL_DOMAIN = "rogueoak.com";

/**
 * True when an (already-validated) email belongs to the internal test domain,
 * matched case-insensitively on the exact domain. The leading `@` anchors it to
 * the domain itself, so a look-alike like `x@notrogueoak.com` or a subdomain like
 * `x@mail.rogueoak.com` is NOT treated as a test address. The route uses this to
 * short-circuit into a fake-success path that never reaches Constant Contact.
 */
export function isTestEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${TEST_EMAIL_DOMAIN}`);
}

/**
 * Split an optional free-text name into Constant Contact first/last name parts.
 * Low-friction single field: the FIRST whitespace-separated token is the first
 * name and the remainder (if any) the last name; a middle name folds into the
 * last name, which is fine. Trims, collapses internal whitespace, caps each part
 * at the Constant Contact field limit, and omits empty parts - so an empty name
 * yields `{}` and adds nothing to the payload.
 */
export function splitName(name: unknown): NameParts {
  const norm = typeof name === "string" ? name.trim().replace(/\s+/g, " ") : "";
  if (!norm) return {};
  const sp = norm.indexOf(" ");
  const first = capChars(sp === -1 ? norm : norm.slice(0, sp), SUBSCRIBE_LIMITS.part);
  const rest = sp === -1 ? "" : capChars(norm.slice(sp + 1), SUBSCRIBE_LIMITS.part);
  const parts: NameParts = {};
  if (first) parts.firstName = first;
  if (rest) parts.lastName = rest;
  return parts;
}

/**
 * Shape a validated email into a Constant Contact `sign_up_form` body.
 * `create_source: "Contact"` marks it as a visitor self-signup. The list ids are
 * supplied by the caller from env and never hard-coded here. `sign_up_form` is
 * additive, so listing a membership never removes the contact's other lists.
 * Optional `first_name`/`last_name` are added ONLY when present, so a nameless
 * signup produces the exact same payload as before.
 */
export function buildSignUpPayload(
  email: string,
  listIds: string[],
  nameParts: NameParts = {},
): SignUpPayload {
  const payload: SignUpPayload = {
    email_address: email,
    create_source: "Contact",
    list_memberships: listIds,
  };
  if (nameParts.firstName) payload.first_name = nameParts.firstName;
  if (nameParts.lastName) payload.last_name = nameParts.lastName;
  return payload;
}

/**
 * Exchange the long-lived (non-rotating) refresh token for a 24h bearer access
 * token. Public client, so no client secret is sent. Throws on a non-2xx so the
 * route returns a generic 500. `fetchImpl` is injectable for tests.
 */
export async function refreshAccessToken(
  { clientId, refreshToken }: { clientId: string; refreshToken: string },
  fetchImpl: typeof fetch = fetch,
): Promise<{ accessToken: string; expiresInSec: number }> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
  });
  const res = await fetchImpl(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
    // Bound the upstream call so a stalled auth server can't hang the request.
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `Constant Contact token responded ${res.status}: ${detail.slice(0, 200)}`,
    );
  }
  const json = await res.json();
  if (!json || typeof json.access_token !== "string")
    throw new Error("Constant Contact token response missing access_token");
  return {
    accessToken: json.access_token,
    // Default to 24h if the field is absent, minus the skew applied by the cache.
    expiresInSec: typeof json.expires_in === "number" ? json.expires_in : 86_400,
  };
}

/** An HTTP error carrying the upstream status, so callers can branch on it. */
type StatusError = Error & { status?: number };

/**
 * Add (or update) a contact on the target list(s) via `sign_up_form`, opting them
 * in. Throws on a non-2xx. Optional `nameParts` become first/last name on the
 * contact. `fetchImpl` is injectable for tests.
 */
export async function addContactToList(
  {
    accessToken,
    email,
    listIds,
    nameParts,
  }: {
    accessToken: string;
    email: string;
    listIds: string[];
    nameParts?: NameParts;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  const res = await fetchImpl(SIGNUP_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(buildSignUpPayload(email, listIds, nameParts)),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    // Do NOT fold the response body into the error: sign_up_form 4xx bodies can
    // echo the submitted email_address, and the route logs thrown errors - that
    // would leak a subscriber's email into container logs. Status only. Attach it
    // as `err.status` so callers can branch (e.g. self-heal on a stale-token 401).
    const err: StatusError = new Error(
      `Constant Contact sign_up_form responded ${res.status}`,
    );
    err.status = res.status;
    throw err;
  }
  return res;
}

/** The in-memory access-token cache returned by `createTokenCache`. */
export type TokenCache = {
  getAccessToken(
    creds: { clientId: string; refreshToken: string },
    fetchImpl?: typeof fetch,
  ): Promise<string>;
  clear(): void;
};

/**
 * A tiny in-memory access-token cache. Mints a token on the first call, then
 * reuses it until shortly before expiry, so a burst of submits does not hammer
 * the auth server. Safe because the refresh token is non-rotating - a refresh
 * yields a new access token but the same refresh token, so there is nothing to
 * persist. Single-process by design (module-scoped in the route); a restart just
 * re-mints. `now` is injectable so expiry is unit-testable without a real clock.
 * @param now - returns epoch ms
 */
export function createTokenCache(now: () => number = Date.now): TokenCache {
  let cached: { token: string; expiresAtMs: number } | null = null;
  /** in-flight mint, shared by concurrent callers */
  let inflight: Promise<string> | null = null;
  return {
    getAccessToken(
      creds: { clientId: string; refreshToken: string },
      fetchImpl: typeof fetch = fetch,
    ): Promise<string> {
      if (cached && now() < cached.expiresAtMs)
        return Promise.resolve(cached.token);
      // Memoize the in-flight refresh so a cold-cache burst shares ONE mint
      // instead of each concurrent caller hitting the auth server. Cleared in
      // `finally` so a failed mint does not wedge the cache (the next call retries).
      if (!inflight) {
        inflight = refreshAccessToken(creds, fetchImpl)
          .then(({ accessToken, expiresInSec }) => {
            cached = {
              token: accessToken,
              expiresAtMs: now() + (expiresInSec - EXPIRY_SKEW_SEC) * 1000,
            };
            return accessToken;
          })
          .finally(() => {
            inflight = null;
          });
      }
      return inflight;
    },
    /** Test/reset helper: drop any cached token. */
    clear() {
      cached = null;
    },
  };
}

/** Params for the subscription orchestrator. */
type ContactWriteArgs = {
  email: string;
  name?: string;
  clientId: string;
  refreshToken: string;
  listIds: string[];
};

/**
 * Run a token-authenticated CTCT write, self-healing once on a stale token. A
 * cached access token can be invalidated upstream before its computed TTL
 * (revocation, >60s clock skew, or an early Constant Contact expiry). Rather than
 * 500ing every request until the process restarts, on a 401 we drop the stale
 * token, mint a fresh one, and retry the operation a single time.
 */
async function withFreshTokenRetry(
  creds: { clientId: string; refreshToken: string },
  cache: TokenCache,
  fetchImpl: typeof fetch,
  op: (accessToken: string) => Promise<unknown>,
): Promise<void> {
  const accessToken = await cache.getAccessToken(creds, fetchImpl);
  try {
    await op(accessToken);
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      (err as StatusError).status === 401
    ) {
      cache.clear();
      const fresh = await cache.getAccessToken(creds, fetchImpl);
      await op(fresh);
      return;
    }
    throw err;
  }
}

/**
 * Orchestrate a subscription: get (cached or fresh) access token, then add the
 * contact to the given list(s) via `sign_up_form` (opt-in). Throws on any non-2xx
 * so the caller maps it to a generic 500. The `cache` is supplied by the caller
 * (module-scoped) so it persists across requests; `fetchImpl` is injectable for
 * tests. The optional `name` is split into first/last name and stored on the
 * contact; an empty/absent name adds nothing to the payload.
 */
export async function submitSubscription(
  { email, name, clientId, refreshToken, listIds }: ContactWriteArgs,
  { fetchImpl = fetch, cache }: { fetchImpl?: typeof fetch; cache: TokenCache },
): Promise<void> {
  const nameParts = splitName(name);
  await withFreshTokenRetry(
    { clientId, refreshToken },
    cache,
    fetchImpl,
    (accessToken) =>
      addContactToList({ accessToken, email, listIds, nameParts }, fetchImpl),
  );
}
