# 0005 - The hidden `company` honeypot dropped real submissions (autofill false-negative)

## Symptom

The subscribe and contact forms carried a hidden `company` honeypot field: an off-screen input a
real user never sees, whose being filled marked the request a bot and dropped it silently (200, so
the "bot" learns nothing). In practice, aggressive password managers and browser autofill fill
off-screen fields anyway, so a genuine visitor's submission could be silently discarded with no
error - a false negative that loses real signups and messages with no trace.

## Root cause

A honeypot assumes only bots fill hidden inputs. Modern autofill breaks that assumption: it does not
respect `autoComplete="off"` / `tabIndex={-1}` / off-screen positioning reliably, so a real form can
trip its own trap. The silent-drop design that makes a honeypot effective against bots is exactly
what makes this failure invisible.

## Fix

Removed the honeypot end to end, mirroring canopy feedback 0024 and the `@rogueoak/canopy@1.4.0`
release that dropped `company` from `SubscribeForm` (`SubscribeValues` is now `{ email, name }`).
Bumped `@rogueoak/canopy`, `@rogueoak/roots`, and `@rogueoak/icons` to `^1.4.0`. Dropped the
`company` field from the subscribe wrapper's POST body and the hand-rolled contact form's hidden
input + body; removed the `isHoneypotFilled(input.company)` drop from both `/v1/subscribe` and
`/v1/contact`; and deleted the now-unused `isHoneypotFilled` guard (and its unit test) from
`http-guards.ts`. The same-origin check and per-IP rate limiter remain the spam guards.

## Learning

A spam guard that can silently reject a real user is worse than the spam it stops - especially one
that fails invisibly. The same-origin + rate-limit guards thin drive-by spam without ever discarding
a legitimate submission, so they carry the load; a honeypot's silent-drop trades a real-user
false-negative for marginal bot coverage and is not worth it here.
