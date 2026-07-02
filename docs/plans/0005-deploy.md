# 0005 - Build plan: deploy to DigitalOcean

Source spec: `docs/specs/0005-deploy.md`. Reference: matthewmaynes.com `deploy/docker/` +
the `deploy` job in `.github/workflows/deploy.yml`.

## Step 1 - Edge proxy stack

File: `deploy/docker/compose.proxy.yml` - `caddy:2-alpine`, publishes 80/443/443udp, mounts
`./Caddyfile` (ro) + `caddy_data`/`caddy_config` volumes, on external `edge` network, `name: proxy`.

File: `deploy/docker/Caddyfile` - `rogueoak.com { encode zstd gzip; header HSTS; reverse_proxy
site:3000 }` and `www.rogueoak.com { redir https://rogueoak.com{uri} permanent }`. No ACME email.

## Step 2 - Site stack

File: `deploy/docker/compose.site.yml` - service `site`, image
`ghcr.io/rogueoak/rogueoak:${IMAGE_TAG:-latest}`, `container_name: site`, `restart: unless-stopped`,
`expose: [3000]` (no host port), `environment: NODE_ENV=production`, `networks: [edge]`,
external `edge` network, `name: site`. No `env_file`.

## Step 3 - Deploy job

File: `.github/workflows/release.yml` - add `deploy` job (`needs: build`, `runs-on: ubuntu-latest`).
Steps: write SSH key + pinned known_hosts, then SSH to `$DEPLOY_USER@$DEPLOY_HOST` running a remote
script with `IMAGE_TAG=sha-${{ github.sha }}`:
- clone `https://github.com/rogueoak/rogueoak.git` to `~/rogueoak` if `.git` missing;
- `git fetch --prune origin` + `git reset --hard origin/main`;
- `docker network create edge` if absent;
- `docker compose -f deploy/docker/compose.proxy.yml up -d`;
- `docker compose -f deploy/docker/compose.site.yml pull` + `up -d --wait`;
- `docker image prune -f --filter label=org.opencontainers.image.source=https://github.com/rogueoak/rogueoak`.
Secrets: `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`, `DEPLOY_HOST`, `DEPLOY_USER`.

## Step 4 - Docs

- `README.md` (or a `deploy/README.md`): host prerequisites (Docker + `deploy` user in docker group +
  authorized key; image public; DNS A records for apex + www) and the four `DEPLOY_*` secrets.

## Step 5 - Verify

- YAML parses; compose files parse (`docker compose config` if Docker present - it is not here, so
  fall back to a YAML read); the referenced image/tag and network names are consistent across files.
- The real end-to-end test runs on merge: the `deploy` job SSHes in and brings the site up. Confirm
  after merge that the job is green and `https://rogueoak.com` serves over TLS.

## Step 6 - Commit, PR, review

- Conventional Commit, open PR.
- Persona review: security (SSH key handling, pinned known_hosts, least-privilege token, no secrets,
  self-bootstrap `git reset --hard`/clone safety, public-image pull), architect (two-stack edge
  design, self-bootstrapping trade-off, deploy job in release.yml vs separate, health-gated rollout,
  sha pinning + retention coupling from 0004). engineer/tester: minimal (no app code).
- Address findings, merge on green review.

## Reflect

- `overview/architecture.md` - replace "Deploy shape (planned)" with the real deploy (Caddy edge +
  site stack, self-bootstrapping health-gated deploy job, TLS).
- `overview/project.md` - the site is live.
- `overview/learnings.md` - only if a real lesson emerges from the first live deploy.
