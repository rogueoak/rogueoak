# Deploy

rogueoak.com runs as a container on a DigitalOcean droplet, **cohosted with matthewmaynes.com**
behind a shared Caddy edge proxy that terminates TLS. The `matthewmaynes` repo owns that proxy and
routes `rogueoak.com` -> `rogueoak:3000` over the shared `edge` network; this repo ships only its
own site stack. Deploys are automatic: every push to `main` runs `.github/workflows/release.yml`
(verify -> build -> **deploy**), and the deploy job SSHes into the droplet and rolls the site
forward to the image built for that commit (`ghcr.io/rogueoak/rogueoak:sha-<commit>`).

## Stacks (`deploy/docker/`)

- `compose.site.yml` - the **rogueoak** stack (project / service / container all named `rogueoak`,
  distinct from the cohosted `site` stack). Runs the prebuilt GHCR image, publishes no host port
  (Caddy reaches it as `rogueoak:3000` on the shared `edge` network), `NODE_ENV=production`. Reads
  its runtime secrets from a host-side `.env.site` (optional, `required: false` - the stack starts
  without it and the affected route just fails closed). That file is **generated on every deploy
  from GitHub Actions Secrets** (spec 0011). See "Runtime secrets" below.

The Caddy edge proxy and its Caddyfile live in the `matthewmaynes` repo, which is the single owner
of the TLS terminator for every domain on this host. This repo no longer ships a `compose.proxy.yml`
or `Caddyfile`: two deploys each bringing up their own Caddy would fight over ports 80/443 and knock
the other site offline.

## Host prerequisites (one-time)

The deploy job is self-bootstrapping, so a fresh droplet needs only:

1. **Docker Engine + Compose** installed and running.
2. A **`deploy` user** in the `docker` group: `adduser --disabled-password --gecos "" deploy &&
   usermod -aG docker deploy`.
3. The deploy **public key** in `/home/deploy/.ssh/authorized_keys` (the private key is the
   `DEPLOY_SSH_KEY` secret).
4. Firewall open on 22, 80, 443.
5. **DNS**: `A` records for `rogueoak.com` and `www.rogueoak.com` pointing at the droplet IP (Caddy
   needs this to issue TLS).
6. The **GHCR package is public** (`ghcr.io/rogueoak/rogueoak`), so the host pulls without login.
7. The **shared edge proxy** is deployed from the `matthewmaynes` repo (it owns the Caddy stack and
   the `rogueoak.com` route). Deploy or update it there so the route exists before/when this site
   comes up. Deploy order does not matter for the network: whichever stack runs first creates the
   external `edge` network.

The deploy job itself clones the repo to `~deploy/rogueoak` on first run, ensures the shared `edge`
network exists, and deploys the site - it no longer manages the proxy (the `matthewmaynes` repo does).

## Runtime secrets (`deploy/docker/.env.site`)

The site's server-only secrets are read at runtime from a host-side `deploy/docker/.env.site`,
git-ignored (the `.env*` rule) and untracked, so they never land in git or the image. Since spec
0011 the deploy job **generates this file on every deploy from GitHub Actions Secrets** (it is no
longer hand-created on the box): the six values below are stored as **Secrets** (encrypted, masked
in logs), assembled into a base64 blob on the runner, and decoded into `.env.site` (chmod 600) on
the droplet. GitHub Actions is the **single source of truth**.

| Var | Used by | Value |
|---|---|---|
| `CTCT_CLIENT_ID` | subscribe (0008) + contact opt-in (0011) | Constant Contact app client id (public client) |
| `CTCT_REFRESH_TOKEN` | subscribe + contact opt-in + keepalive (0009) | long-lived refresh token |
| `CTCT_LIST_ID` | subscribe + contact opt-in | id of the "Rogue Oak" list (`630fc3a0-7eda-11f1-9567-02420a320002`) |
| `RESEND_API_KEY` | contact (0011) + keepalive alert (0009) | Resend key, domain-verified for rogueoak.com |
| `CONTACT_TO_EMAIL` | contact + keepalive alert | destination inbox, e.g. `contact@rogueoak.com` |
| `CONTACT_FROM_EMAIL` | contact + keepalive alert | verified sender, e.g. `Rogue Oak <contact@rogueoak.com>` |

Set all six under **Settings -> Secrets and variables -> Actions -> Secrets**, then deploy (push to
`main` or run the workflow). A missing secret is not fatal: it decodes to an empty value and the
affected feature fails closed (a generic 500) while the rest of the site runs. Mint the CTCT refresh
token with the [`ctct`](https://github.com/mattmaynes/ctct-cli) CLI (`ctct login`, then read the
stored token).

**Because GHA is the source of truth, do not edit `.env.site` on the box** - the next deploy
overwrites it. To change a value (including a re-minted CTCT token, see below), update the GitHub
Actions Secret and redeploy.

### Token keepalive (spec 0009)

The refresh token above is **long-lived**, but a long-lived CTCT token still **expires after
~180 days of inactivity** - and the subscribe route only exercises it when someone actually
subscribes. On a quiet site it can sit idle past that window and expire, 500ing the form with no
warning (this is what took down the cohosted matthewmaynes.com subscribe on 2026-07-14). A daily
host cron prevents it by exercising the token out-of-band and emailing on failure.

The refresh logic lives in the `ctct` CLI (`@mattmaynes/ctct-cli`, `ctct refresh-token`), run as
a container - the box has no Node runtime, and this is one tested implementation shared with the
cohosted matthewmaynes site. `refresh-token` emails nothing itself; a small host wrapper does the
Resend alert. Since spec 0011 the Resend alert credentials (`RESEND_API_KEY`, `CONTACT_TO_EMAIL`,
`CONTACT_FROM_EMAIL`) are part of the generated `.env.site` above (the same domain-verified key the
contact form uses), so the cron reads them straight from that file - nothing extra to append by
hand.

The wrapper `~/ctct-refresh/ctct-keepalive.sh <env-file> <label>` (installed once on the host,
shared with matthewmaynes) runs
`docker run --rm --env-file <env-file> ghcr.io/mattmaynes/ctct-cli refresh-token`, logs to
`~/ctct-refresh/keepalive.log`, and alerts via Resend on failure. Pull the image and schedule the
daily cron (offset from the matthewmaynes keepalive):

```bash
docker pull ghcr.io/mattmaynes/ctct-cli:latest
( crontab -l 2>/dev/null; \
  echo '41 8 * * * /home/deploy/ctct-refresh/ctct-keepalive.sh /home/deploy/rogueoak/deploy/docker/.env.site rogueoak.com >> /home/deploy/ctct-refresh/cron.err 2>&1' \
) | crontab -
```

After a new CLI release, `docker pull ghcr.io/mattmaynes/ctct-cli:latest` to update. Health check:
run `~/ctct-refresh/ctct-keepalive.sh ~/rogueoak/deploy/docker/.env.site rogueoak.com` by hand and
expect `OK token refreshed` in `~/ctct-refresh/keepalive.log`.

### Re-auth when a token is truly dead (device flow)

If the token expires (subscribe 500s; the keepalive log shows `invalid_grant`), re-mint it. The
app is a device-flow public client (no redirect URI, no secret) - easiest via the
[`ctct`](https://github.com/mattmaynes/ctct-cli) CLI (`ctct login`), or by hand: POST
`client_id` + `scope=contact_data offline_access` to
`https://authz.constantcontact.com/oauth2/default/v1/device/authorize`, approve the returned
`verification_uri_complete` in a browser, then poll
`https://authz.constantcontact.com/oauth2/default/v1/token` with
`grant_type=urn:ietf:params:oauth:grant-type:device_code` until it returns a new `refresh_token`.
Update the **`CTCT_REFRESH_TOKEN` GitHub Actions Secret** with it (not the box file - a deploy
regenerates `.env.site`) and redeploy (push to `main` or run the workflow), which rewrites
`.env.site` and recreates the container so it re-reads env.

## GitHub Actions secrets

Set under **Settings -> Secrets and variables -> Actions**:

| Secret | Value |
|---|---|
| `DEPLOY_SSH_KEY` | the **private** SSH key for the `deploy` user |
| `DEPLOY_KNOWN_HOSTS` | `ssh-keyscan <droplet-ip>` output (pins the host key) |
| `DEPLOY_HOST` | droplet IP or hostname |
| `DEPLOY_USER` | `deploy` |
| `CTCT_CLIENT_ID` | Constant Contact app client id |
| `CTCT_REFRESH_TOKEN` | long-lived Constant Contact refresh token |
| `CTCT_LIST_ID` | id of the "Rogue Oak" list |
| `RESEND_API_KEY` | Resend key, domain-verified for rogueoak.com |
| `CONTACT_TO_EMAIL` | contact destination inbox |
| `CONTACT_FROM_EMAIL` | contact verified sender |

The last six feed the generated `.env.site` (see "Runtime secrets"); the deploy job maps each into
the file on the box every run. All are Secrets (not Variables) so they stay encrypted and masked.

## Rollback

Re-run the deploy against an older image by setting `IMAGE_TAG` to a prior `sha-<commit>` on the
host and running `docker compose -f deploy/docker/compose.site.yml up -d --wait`, or re-run the
release workflow for the older commit. Retention keeps the 30 most recent tagged images
(`cleanup-images.yml`).
