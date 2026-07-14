#!/usr/bin/env bash
#
# refresh-ctct-token.sh - keep the Constant Contact refresh token alive.
#
# Why this exists: the subscribe route (`/v1/subscribe`) mints a CTCT access token
# from a long-lived refresh token, but a long-lived refresh token still expires
# after 180 days of INACTIVITY, and its idle clock resets only when it is used. The
# route mints lazily (only on a real subscribe, then caches the access token ~24h),
# so on a low-traffic site the token can sit unused past 180 days and expire - the
# subscribe form then 500s with no earlier signal. This is exactly what took down
# the cohosted matthewmaynes.com subscribe on 2026-07-14. This script exercises the
# token on a fixed schedule (cron) so the idle clock never runs out, and emails an
# alert via Resend if a refresh ever fails.
#
# It reads all secrets from the host-only .env.site (never hard-coded; this file is
# committed to a PUBLIC repo). rogueoak's own .env.site carries only the CTCT keys,
# so the Resend alert credentials (RESEND_API_KEY / CONTACT_TO_EMAIL /
# CONTACT_FROM_EMAIL) are added to it on the host purely for this keepalive - the
# app itself does not use them. Safe to run repeatedly; makes no change on success
# unless CTCT returns a rotated token (defensive - long-lived tokens do not rotate).
#
# Usage: refresh-ctct-token.sh [/path/to/.env.site]
set -u

ENV_FILE="${1:-$HOME/rogueoak/deploy/docker/.env.site}"
LOG_FILE="${CTCT_REFRESH_LOG:-$HOME/ctct-refresh/rogueoak-refresh.log}"
TOKEN_URL="https://authz.constantcontact.com/oauth2/default/v1/token"
SITE_LABEL="rogueoak.com subscribe"

mkdir -p "$(dirname "$LOG_FILE")"
log() { printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1" >>"$LOG_FILE"; }

# Pull one KEY=VALUE from the env file without sourcing it (values may contain
# characters that would break `source`).
getval() { grep -E "^$1=" "$ENV_FILE" | head -1 | cut -d= -f2-; }

# Send a failure alert through Resend. Best-effort: a notification failure must
# never mask the original error in the exit code.
notify_failure() {
  local reason="$1" api to from
  api="$(getval RESEND_API_KEY)"; to="$(getval CONTACT_TO_EMAIL)"; from="$(getval CONTACT_FROM_EMAIL)"
  [ -n "$api" ] && [ -n "$to" ] && [ -n "$from" ] || { log "ALERT-SKIPPED no Resend config in $ENV_FILE"; return; }
  local body
  body=$(printf '{"from":"%s","to":["%s"],"subject":"[ALERT] CTCT token refresh failed - %s","text":%s}' \
    "$from" "$to" "$SITE_LABEL" \
    "$(printf '%s' "CTCT refresh-token keepalive FAILED for $SITE_LABEL.

Reason: $reason

The subscribe form will start returning 500 once the current access token
expires (within ~24h). Re-authorize with the device flow - see deploy/README.md
(Subscribe secrets / re-auth). Log: $LOG_FILE on the box." | python3 -c 'import json,sys;print(json.dumps(sys.stdin.read()))')")
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "https://api.resend.com/emails" \
    -H "Authorization: Bearer $api" -H "Content-Type: application/json" --data "$body")
  log "ALERT-SENT resend-http=$code"
}

CLIENT_ID="$(getval CTCT_CLIENT_ID)"
REFRESH_TOKEN="$(getval CTCT_REFRESH_TOKEN)"
if [ -z "$CLIENT_ID" ] || [ -z "$REFRESH_TOKEN" ]; then
  log "FAIL missing CTCT_CLIENT_ID/CTCT_REFRESH_TOKEN in $ENV_FILE"
  notify_failure "CTCT_CLIENT_ID or CTCT_REFRESH_TOKEN missing in $ENV_FILE"
  exit 1
fi

resp="$(curl -s -m 20 -w $'\n%{http_code}' -X POST "$TOKEN_URL" \
  -H "Content-Type: application/x-www-form-urlencoded" -H "Accept: application/json" \
  --data-urlencode "grant_type=refresh_token" \
  --data-urlencode "refresh_token=$REFRESH_TOKEN" \
  --data-urlencode "client_id=$CLIENT_ID")"
http_code="$(printf '%s' "$resp" | tail -1)"
json="$(printf '%s' "$resp" | sed '$d')"

if [ "$http_code" != "200" ] || ! printf '%s' "$json" | grep -q '"access_token"'; then
  # Do not log the body verbatim beyond the error field (keeps tokens out of logs).
  err="$(printf '%s' "$json" | grep -oE '"error[^"]*":"[^"]*"' | tr '\n' ' ')"
  log "FAIL http=$http_code $err"
  notify_failure "Token endpoint returned HTTP $http_code. ${err:-no error detail}"
  exit 1
fi

# Success: the 180-day idle clock is reset. Long-lived tokens return the SAME
# refresh token; if CTCT ever returns a different one (config drift to rotating),
# persist it atomically so the next container recreate uses the live token.
new_rt="$(printf '%s' "$json" | grep -oE '"refresh_token":"[^"]+"' | cut -d'"' -f4)"
if [ -n "$new_rt" ] && [ "$new_rt" != "$REFRESH_TOKEN" ]; then
  ts="$(date -u +%Y%m%d-%H%M%SZ)"
  cp "$ENV_FILE" "$ENV_FILE.bak-$ts"
  tmp="$(mktemp)"
  new_rt="$new_rt" awk '/^CTCT_REFRESH_TOKEN=/{print "CTCT_REFRESH_TOKEN=" ENVIRON["new_rt"]; next} {print}' \
    "$ENV_FILE" >"$tmp" && mv "$tmp" "$ENV_FILE"
  log "OK refresh rotated - persisted new token (backup $ENV_FILE.bak-$ts); recreate container to load it"
else
  log "OK token refreshed (idle clock reset)"
fi
exit 0
