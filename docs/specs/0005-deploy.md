# 0005 - Deploy to DigitalOcean

## Problem

The release pipeline (0004) publishes a container image to GHCR, but nothing runs it. We need
rogueoak.com to actually serve from a DigitalOcean droplet, behind TLS, updated automatically when
`main` changes - pinning the exact image built for that commit so the running version is auditable
and rollback is a one-line change.

Audience: visitors to rogueoak.com; and maintainers who need a reproducible, hands-off deploy.

## Outcome

- On push to `main`: after `verify` and `build` (0004), a `deploy` job SSHes into the droplet as the
  `deploy` user and rolls the site forward to the image tagged `sha-<commit>`.
- The site is served over HTTPS at `https://rogueoak.com` (and `www` redirects to the apex), with
  certificates auto-issued and renewed by a Caddy edge proxy.
- The update is health-gated: `docker compose up -d --wait` only succeeds if the new container passes
  its `HEALTHCHECK`, so a broken image is a red deploy, not a flapping site.
- The deploy is **self-bootstrapping**: a fresh droplet needs only Docker + the `deploy` user (in the
  `docker` group) + the authorized SSH key. The job clones the repo if absent, ensures the shared
  network and edge proxy are up, then deploys the site - no other manual host steps.
- No secrets live in the repo; the image is public on GHCR, so the host pulls without login.

## Scope

**In:**
- `deploy/docker/compose.proxy.yml` - Caddy edge proxy (the only stack publishing host ports
  80/443), on a shared external `edge` network, persisting ACME data.
- `deploy/docker/Caddyfile` - apex `rogueoak.com` -> `site:3000` with HSTS; `www` -> apex redirect;
  auto-TLS. No ACME email in the tracked file (privacy).
- `deploy/docker/compose.site.yml` - the site service running
  `ghcr.io/rogueoak/rogueoak:${IMAGE_TAG:-latest}`, `expose: 3000` (no host port), `NODE_ENV=production`,
  on the `edge` network.
- A `deploy` job added to `.github/workflows/release.yml` (`needs: build`): SSH in, `git reset
  --hard origin/main`, ensure network + proxy, `compose pull` + `up -d --wait` the site, label-scoped
  image prune.
- Host setup notes (the one-time facts: `deploy` user in `docker` group, authorized key, image
  public, DNS A records) and the four `DEPLOY_*` GitHub secrets.

**Out:**
- Server-side analytics/secrets (no Resend, no server PostHog for v1) - the site stack has no
  `env_file`.
- Staging/multi-environment, blue-green, multi-droplet, IaC provisioning of the droplet itself.
- The next/image prewarm (mmc-specific).

## Approach

Mirror matthewmaynes.com's `deploy/docker/` stacks and the `deploy` job of its `deploy.yml`.

- **Two compose stacks on a shared external `edge` network**: the `proxy` stack (Caddy) is the only
  one publishing host ports and terminates TLS; the `site` stack publishes no host port and is
  reached by Caddy as `site:3000`. Explicit `name:` on each so they never collide.
- **`compose.site.yml`** is intentionally minimal: `NODE_ENV=production` only. `SITE_URL` is baked at
  build time (0003), so it is deliberately not set at runtime; there is no server-side secret to
  inject, so there is no `env_file`.
- **Self-bootstrapping `deploy` job** (the difference from mmc, which bootstraps the host by hand):
  the remote script clones the repo to `~/rogueoak` if missing, `git fetch` + `reset --hard
  origin/main` (so a stray host edit can never wedge a deploy), `docker network create edge` if
  absent, `docker compose -f deploy/docker/compose.proxy.yml up -d` (idempotent; applies Caddyfile
  changes), then `IMAGE_TAG=sha-${{ github.sha }}` `compose -f compose.site.yml pull` + `up -d
  --wait`, then a label-scoped `docker image prune` (only this project's images). Trade-off: the
  deploy touches the proxy stack each run; it is idempotent and keeps the host reproducible from an
  empty box, which is worth more than strict proxy/app separation here.
- **SSH** uses the four secrets from host setup: `DEPLOY_SSH_KEY` (private key), `DEPLOY_KNOWN_HOSTS`
  (pinned host key - no trust-on-first-use), `DEPLOY_HOST`, `DEPLOY_USER`. `BatchMode=yes`,
  `ConnectTimeout`. The `deploy` job inherits the workflow's read-only token; it needs no
  `packages: write` (the image is public and already pushed by `build`).
- Reuses the run-level `concurrency: release-main` so deploys never overlap.

## Acceptance

- [ ] `deploy/docker/` contains `compose.proxy.yml`, `compose.site.yml`, `Caddyfile`; the two stacks
      share the external `edge` network and only the proxy publishes ports.
- [ ] `release.yml` gains a `deploy` job (`needs: build`) that SSHes in and runs the self-bootstrap +
      health-gated `compose up -d --wait` against the `sha-<commit>` image.
- [ ] The site compose sets `NODE_ENV=production` and no runtime `SITE_URL`/secret; no `env_file`.
- [ ] The deploy uses the pinned `sha-<full-sha>` tag (auditable; rollback = re-run with an older sha).
- [ ] Caddy serves `https://rogueoak.com` with a valid cert and redirects `www` -> apex once DNS
      resolves and the stack is up.
- [ ] No secrets are committed; the Caddyfile sets no ACME email; the image pulls without host login.
- [ ] After merge, the deploy job runs green and `https://rogueoak.com` serves the site over TLS.
