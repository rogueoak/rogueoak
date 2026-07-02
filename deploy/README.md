# Deploy

rogueoak.com runs as a container on a DigitalOcean droplet, behind a Caddy edge proxy that
terminates TLS. Deploys are automatic: every push to `main` runs
`.github/workflows/release.yml` (verify -> build -> **deploy**), and the deploy job SSHes into the
droplet and rolls the site forward to the image built for that commit
(`ghcr.io/rogueoak/rogueoak:sha-<commit>`).

## Stacks (`deploy/docker/`)

- `compose.proxy.yml` + `Caddyfile` - the **Caddy** edge proxy. The only stack that publishes host
  ports (80/443). Auto-issues and renews Let's Encrypt certs; routes `rogueoak.com` -> `site:3000`
  and redirects `www` -> apex.
- `compose.site.yml` - the **site** stack. Runs the prebuilt GHCR image, publishes no host port
  (Caddy reaches it as `site:3000` on the shared `edge` network), `NODE_ENV=production`. No secrets.

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

The deploy job itself clones the repo to `~deploy/rogueoak` on first run, creates the `edge`
network, brings up the proxy, and deploys the site - no other manual host steps.

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
