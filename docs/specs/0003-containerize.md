# 0003 - Containerize the site

## Problem

The site runs locally with `npm run dev`, but the deploy target (a DigitalOcean droplet, spec 0005)
runs containers, and the release pipeline (0004) needs something to build and publish. We need a
production container image that serves the Next.js standalone output, plus a way to build and run it
locally to confirm it works.

Audience: the release pipeline (0004), the deploy host (0005), and anyone wanting to run the
production build locally.

## Outcome

- `docker build -t rogueoak-site .` produces a small image that serves the site.
- `docker run -p 3000:3000 rogueoak-site` (or `docker compose up`) serves `/` on
  `http://localhost:3000` with all sections rendering, exactly like the production build.
- The image runs the Next.js **standalone** server (`node server.js`) as a **non-root** user, on
  Node 24 (matching CI), exposes port 3000, and has a working `HEALTHCHECK`.
- The build context excludes `node_modules`, `.next`, `.git`, secrets, and local scratch via
  `.dockerignore`.
- No secrets are baked into the image; runtime config comes from environment variables.

## Scope

**In:**
- `Dockerfile` - multi-stage (`deps` -> `build` -> `runtime`) on `node:24-alpine`, standalone output,
  non-root `node` user, `EXPOSE 3000`, Node-based `HEALTHCHECK` (alpine has no curl).
- `.dockerignore` - keep the build context lean and secret-free.
- `docker-compose.yml` - local convenience: build the image, map `3000:3000`, set
  `NODE_ENV=production` and `SITE_URL`.

**Out (later specs):**
- Pushing the image to a registry / GHCR (0004).
- Deploying to DigitalOcean, the edge proxy, TLS (0005).
- Multi-arch builds and image signing (can come with the release pipeline if wanted).

## Approach

Mirror matthewmaynes.com's Dockerfile, which already builds this exact Next.js standalone shape.
`next.config.ts` already sets `output: "standalone"` and `outputFileTracingRoot`, so `server.js` is
emitted at `.next/standalone/server.js` (the tracing root also avoids the nested `.worktrees/`
lockfile confusing the workspace root).

- **`Dockerfile`** (`# syntax=docker/dockerfile:1`):
  - `deps`: `npm ci` from `package.json` + `package-lock.json`.
  - `build`: copy `node_modules`, copy source, `NEXT_TELEMETRY_DISABLED=1`, `npm run build`.
  - `runtime`: `NODE_ENV=production`, `NEXT_TELEMETRY_DISABLED=1`, `HOSTNAME=0.0.0.0`, `PORT=3000`,
    `USER node`; copy `.next/standalone`, `.next/static`, and `public` with `--chown=node:node`;
    `EXPOSE 3000`; `HEALTHCHECK` using the runtime's own `node` `fetch` on `/`; `CMD ["node",
    "server.js"]`.
- **`.dockerignore`**: `node_modules`, `.next`, `.git(ignore)`, `Dockerfile`, `.dockerignore`,
  `docker-compose.yml`, `README.md`, `.env*` except `.env.example`, `coverage`, `context`,
  `.DS_Store`, `*.tsbuildinfo`, and `.worktrees` (this repo uses git worktrees under it).
- **`docker-compose.yml`**: `web` service building the local `Dockerfile` as image `rogueoak-site`,
  `3000:3000`, `NODE_ENV=production`, `SITE_URL: https://rogueoak.com`, `restart: unless-stopped`.
  Deliberately does not set the deploy-only PostHog server flag, so local prod runs stay silent.

## Acceptance

- [ ] `docker build -t rogueoak-site .` succeeds.
- [ ] `docker run --rm -p 3000:3000 rogueoak-site` serves `/` with HTTP 200 and the page content
      (hero, quote, three projects, footer).
- [ ] The container runs as the non-root `node` user and `CMD` is `node server.js` (standalone).
- [ ] The `HEALTHCHECK` reports healthy once the server is up.
- [ ] `.dockerignore` excludes `node_modules`, `.next`, `.git`, `.env*` (except `.env.example`), and
      `.worktrees`.
- [ ] No secret values are present in the image or committed files.
- [ ] `docker compose up` serves the site the same way.
