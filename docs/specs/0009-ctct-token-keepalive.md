# 0009 - Keep the Constant Contact refresh token alive (cron keepalive + alert)

## Problem

The subscribe endpoint (`/v1/subscribe`, spec 0008) mints a Constant Contact access token
from a long-lived refresh token in the host-only `.env.site`. The CTCT key is configured for
**long-lived** refresh tokens, but a long-lived token still **expires after ~180 days of
inactivity**, and the idle clock resets only when the token is used. The route mints lazily -
only on a real subscribe, then it caches the access token ~24h - so on a low-traffic site the
refresh token can sit unused past 180 days and expire. Nothing exercises it in the meantime
(deploys do not: the cache is lazy), and the first person to subscribe after expiry hits a
500 with no earlier signal.

This is not hypothetical: the cohosted matthewmaynes.com subscribe went down exactly this way
on 2026-07-14. rogueoak runs the identical subscribe code against its own long-lived token, so
it carries the same latent failure - currently un-triggered only because its token has not yet
been idle for 180 days.

For: the site owner (subscribe stays up without manual token babysitting) and every visitor
who tries to subscribe.

## Outcome

Observable when done:

1. A **daily host cron** exercises the refresh token out-of-band (independent of visitor
   traffic), so the 180-day idle clock never runs out.
2. On any refresh failure, the owner gets an **email alert via Resend** naming the failure and
   pointing at the re-auth steps - hours to days before a visitor could hit a 500 (the live
   access token is still valid for up to 24h after the refresh token dies).
3. The keepalive is **idempotent and side-effect-free on success**: a long-lived token returns
   the same value, so `.env.site` is untouched. If CTCT ever returns a *different* refresh
   token (drift to rotating), it is persisted atomically with a backup, and the log flags that
   the container must be recreated to load it.
4. Secrets are never hard-coded (the repo is public): the script reads them from `.env.site`
   at runtime and keeps tokens out of its log (status/error field only).

## Approach

The token-refresh logic lives in the versioned, unit-tested **`ctct` CLI**
(`@mattmaynes/ctct-cli`, `ctct refresh-token`), run as a container on the box (which has no
Node runtime) - one tested implementation shared with the cohosted matthewmaynes site, not
duplicated `curl`.

- A host wrapper `~/ctct-refresh/ctct-keepalive.sh <env-file> <label>` runs
  `docker run --rm --env-file <env-file> ghcr.io/mattmaynes/ctct-cli refresh-token`, logs
  `OK`/`FAIL` (never the minted token), and on failure emails a Resend alert. It lives on the
  host, outside the git checkout, so a deploy `git reset --hard` never disturbs it.
- Host crontab (deploy user): a daily run -> the wrapper for rogueoak's `.env.site`, offset
  from the matthewmaynes keepalive so the two do not fire in the same minute.
- rogueoak has **no Resend credentials of its own** (subscribe only, no contact form), so the
  three alert keys (`RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`) are added to
  the host `.env.site` for the cron; the app does not use them. Documented in `deploy/README.md`.
- One-time re-auth (when a token is truly dead) uses the CTCT **device flow** (`ctct login`, or
  the raw device grant); steps live in `deploy/README.md`.

## Notes

This mirrors the matthewmaynes keepalive (its spec 0033) - the two cohosted sites keep their
deploy and operational tooling symmetric, so a fix in one ports to the other. Out of scope:
switching the key to rotating refresh tokens (more secure, but would require the app and cron
to coordinate a single-writer token store and recreate the container on every rotation -
unjustified for this endpoint).
