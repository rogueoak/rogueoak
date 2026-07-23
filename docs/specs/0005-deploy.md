# 0005 - Deploy to DigitalOcean (zero-downtime)

## Problem

The release pipeline (0004) publishes a container image to GHCR, but nothing runs it. We need
rogueoak.com to actually serve from a DigitalOcean droplet, behind TLS, updated automatically when
`main` changes - pinning the exact image built for that commit so the running version is auditable
and rollback is a one-line change. And the update must be **zero-downtime**: recreating a single
fixed-name container in place leaves a gap with no live upstream, so every push briefly 502s the
site. The site is **cohosted with matthewmaynes.com** behind one shared Caddy proxy; the two should
deploy the same way (matthewmaynes solved the same in-place gap in its spec 0019).

Audience: visitors to rogueoak.com; and maintainers who need a reproducible, hands-off, no-downtime
deploy.

## Outcome

- On push to `main`: after `verify` and `build` (0004), a `deploy` job SSHes into the droplet as the
  `deploy` user and rolls the site forward to the image tagged `sha-<commit>`.
- The roll-forward is **zero-downtime (blue/green)**: the new container comes up and goes healthy
  **alongside** the old one, then the old is removed, so a poll of rogueoak.com returns only 200
  (no 502) across the whole deploy. A broken image never goes healthy, so the old instance keeps
  serving and the deploy fails.
- The site is served over HTTPS at `https://rogueoak.com` (and `www` redirects to the apex), with
  certificates auto-issued and renewed by a **Caddy edge proxy owned by matthewmaynes** (the only
  stack publishing host ports 80/443). Caddy routes `rogueoak.com` to the `rogueoak` alias via
  **dynamic-A upstreams** (re-resolving Docker DNS), so it follows the blue/green swap.
- The update is health-gated end to end: `docker-rollout` waits for the new container's
  `HEALTHCHECK`, and a post-rollout gate curls rogueoak.com through Caddy over loopback and fails
  the deploy on a non-200, so a routing misconfig can't ship a green 502.
- The deploy is **self-bootstrapping**: a fresh droplet needs only Docker + the `deploy` user (in the
  `docker` group) + the authorized SSH key. The job clones the repo if absent, ensures the shared
  `edge` network is up, then deploys the site - no other manual host steps. It does **not** bring up
  Caddy (matthewmaynes owns the shared edge proxy).
- Since spec 0008 the site stack reads its runtime secrets from a host-side, git-ignored
  `deploy/docker/.env.site` (`env_file`, `required: false`); missing file => the affected route
  fails closed, the rest of the site is unaffected. No secrets live in the repo; the image is public
  on GHCR, so the host pulls without login.
- **Since spec 0011 that file is generated on every deploy from GitHub Actions Secrets** (it is no
  longer hand-created on the box). The deploy job assembles the six runtime values
  (`CTCT_CLIENT_ID`, `CTCT_REFRESH_TOKEN`, `CTCT_LIST_ID`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`,
  `CONTACT_FROM_EMAIL`) into a base64 blob on the runner and decodes it into `.env.site` (chmod 600)
  on the droplet, so no secret is interpolated into the remote script or the logs. GitHub Actions is
  the single source of truth; a re-minted CTCT token is updated in the Secret, not on the box. See
  `deploy/README.md` and spec 0011.

## Scope

**In:**
- `deploy/docker/compose.site.yml` - the site service running
  `ghcr.io/rogueoak/rogueoak:${IMAGE_TAG:-latest}`, `expose: 3000` (no host port), `NODE_ENV=production`,
  on the shared external `edge` network. **No `container_name`** so two Compose-indexed instances can
  coexist during a rollout (the service keeps the `rogueoak` network alias). `mem_limit` /
  `mem_reservation` so a rollout's transient 2x footprint can't OOM the shared VM and take down
  matthewmaynes (matthewmaynes feedback 0015). Since 0008: an `env_file` for the host-side
  `.env.site`.
- A `deploy` job added to `.github/workflows/release.yml` (`needs: build`): SSH in, `git reset
  --hard origin/main`, ensure the `edge` network, pre-pull, install the pinned + checksum-verified
  `docker-rollout` plugin (idempotent), `docker rollout` the site, run the post-rollout health gate,
  label-scoped image prune. A `timeout-minutes` bounds a wedged host.
- Host setup notes (the one-time facts: `deploy` user in `docker` group, authorized key, image
  public, DNS A records) and the four `DEPLOY_*` GitHub secrets.

**Out:**
- **Managing Caddy from this repo** - matthewmaynes owns the shared edge proxy, its `Caddyfile`, TLS,
  and the dynamic-A routing amendment for the `rogueoak` alias. This repo references that routing but
  does not ship the proxy stack or a `Caddyfile`.
- A steady 2+ replicas for capacity; the second instance is transient during a rollout only.
- Host provisioning (RAM/swap) - owned by the matthewmaynes operator runbook.
- Server-side analytics beyond the subscribe secrets (no Resend, no server PostHog for v1).
- Staging/multi-environment, multi-droplet, IaC provisioning of the droplet itself.
- The next/image prewarm (mmc-specific).

## Approach

Mirror matthewmaynes' deploy exactly (its `deploy/docker/` site stack and the `deploy` job of its
`deploy.yml`, including the spec 0019 zero-downtime rollout), differing only where it must: this repo
never manages the shared Caddy and has no image prewarm job.

- **Shared external `edge` network**: the matthewmaynes `proxy` stack (Caddy) is the only one
  publishing host ports and terminates TLS; the rogueoak `site` stack publishes no host port and is
  reached by Caddy as `rogueoak:3000`.
- **`compose.site.yml`** is intentionally minimal: `NODE_ENV=production` (plus the 0008 `env_file`).
  `SITE_URL` is baked at build time (0003), so it is deliberately not set at runtime. Dropping
  `container_name` lets two indexed instances coexist mid-rollout while keeping the `rogueoak` alias;
  `mem_limit` / `mem_reservation` cap each service so a rollout can't starve the cohosted box.
- **Zero-downtime `deploy` job** using [`docker-rollout`](https://github.com/Wowu/docker-rollout):
  it scales `rogueoak` to two Compose-indexed instances, waits for the new `HEALTHCHECK`, then
  removes the old (and performs the one-time cutover from the legacy `container_name: rogueoak`
  container). It is fail-safe: a broken image never goes healthy, so the old keeps serving and the
  deploy fails. The plugin is pinned to a commit SHA and sha256-verified before it is made
  executable. A post-rollout health gate curls `https://rogueoak.com` via
  `--resolve rogueoak.com:443:127.0.0.1` (Caddy runs on this host on 443), failing on a non-200.
  Caddy following the swap depends on the matthewmaynes `Caddyfile` using **dynamic-A upstreams** for
  the `rogueoak` alias (0019 amendment), landed in that repo before this deploy ships.
- **Self-bootstrapping** (the difference from mmc, which bootstraps the host by hand): the remote
  script clones the repo to `~/rogueoak` if missing, `git fetch` + `reset --hard origin/main` (so a
  stray host edit can never wedge a deploy), `docker network create edge` if absent, pre-pulls the
  `sha-<commit>` image, then rolls out, health-gates, and runs a label-scoped `docker image prune -af`
  (drops superseded `sha-<commit>` images; the running image is in use and kept). It does **not**
  bring up Caddy.
- **SSH** uses the four secrets from host setup: `DEPLOY_SSH_KEY` (private key), `DEPLOY_KNOWN_HOSTS`
  (pinned host key - no trust-on-first-use), `DEPLOY_HOST`, `DEPLOY_USER`. `BatchMode=yes`,
  `ConnectTimeout`. The `deploy` job inherits the workflow's read-only token; it needs no
  `packages: write` (the image is public and already pushed by `build`). Reuses the run-level
  `concurrency: release-main` so deploys never overlap.
- **Capacity**: the rollout briefly doubles rogueoak's footprint; combined with matthewmaynes' own
  overlaps, the host must hold it (~1GB + 2GB swap and per-service `mem_limit`, sized after the
  matthewmaynes OOM incident, feedback 0015).

## Acceptance

- [ ] `deploy/docker/compose.site.yml` runs the site with no host port, on the shared external `edge`
      network, with **no `container_name`**, the `rogueoak` alias, and `mem_limit`/`mem_reservation`.
- [ ] `release.yml` gains a `deploy` job (`needs: build`) that SSHes in and runs the self-bootstrap +
      `docker rollout` against the `sha-<commit>` image, with a post-rollout health gate and a
      `timeout-minutes` bound.
- [ ] `docker-rollout` is installed from a pinned source and checksum-verified before use
      (idempotent).
- [ ] A poll of rogueoak.com through a real deploy returns only 200 (no 502) from before the deploy
      starts until after it completes; mid-rollout two `rogueoak-*` containers run concurrently, then
      collapse to one.
- [ ] A pullable-but-unhealthy image fails the deploy while the old instance keeps serving.
- [ ] The deploy uses the pinned `sha-<full-sha>` tag (auditable; rollback = re-run with an older sha).
- [ ] Caddy (owned by matthewmaynes) serves `https://rogueoak.com` with a valid cert and redirects
      `www` -> apex; this repo ships no proxy stack or `Caddyfile` and never manages Caddy.
- [ ] No secrets are committed; the image pulls without host login; the deploy job needs no
      `packages: write`.
- [ ] The deploy job is structurally identical to matthewmaynes' except: it never manages Caddy, has
      no prewarm job, and uses rogueoak names/image.
- [ ] After merge, the deploy job runs green and `https://rogueoak.com` serves the site over TLS with
      no user-visible downtime.
