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
  the subscribe secrets from a host-side `.env.site` (optional, `required: false` - the stack starts
  without it and the subscribe route just fails closed). See "Subscribe secrets" below.

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

## Subscribe secrets (`deploy/docker/.env.site`)

The subscribe endpoint (spec 0008) writes to the "Rogue Oak" Constant Contact list. Its
credentials are **server-only** and are read at runtime from a host-side `deploy/docker/.env.site`
- created **once** on the droplet, git-ignored (the `.env*` rule) and untracked, so it survives
deploys and never lands in git or the image. This mirrors the cohosted matthewmaynes stack's
`.env.site`. Create it once, next to `compose.site.yml`, and lock it down:

```bash
# on the droplet, as the deploy user, in ~deploy/rogueoak/deploy/docker
cat > .env.site <<'EOF'
CTCT_CLIENT_ID=<constant-contact-app-client-id>
CTCT_REFRESH_TOKEN=<long-lived-refresh-token>
CTCT_LIST_ID=630fc3a0-7eda-11f1-9567-02420a320002
EOF
chmod 600 .env.site
```

`CTCT_LIST_ID` above is the "Rogue Oak" list. Mint the refresh token with the
[`ctct`](https://github.com/mattmaynes/ctct-cli) CLI (`ctct login`, then read the stored token).
Without this file the site still runs; the subscribe route just returns a generic 500 until it
exists. A `docker rollout` / `compose up` picks up edits on the next deploy (restart).

## GitHub Actions secrets

Set under **Settings -> Secrets and variables -> Actions**:

| Secret | Value |
|---|---|
| `DEPLOY_SSH_KEY` | the **private** SSH key for the `deploy` user |
| `DEPLOY_KNOWN_HOSTS` | `ssh-keyscan <droplet-ip>` output (pins the host key) |
| `DEPLOY_HOST` | droplet IP or hostname |
| `DEPLOY_USER` | `deploy` |

## Rollback

Re-run the deploy against an older image by setting `IMAGE_TAG` to a prior `sha-<commit>` on the
host and running `docker compose -f deploy/docker/compose.site.yml up -d --wait`, or re-run the
release workflow for the older commit. Retention keeps the 30 most recent tagged images
(`cleanup-images.yml`).
