# 0003 - Build plan: containerize the site

Source spec: `docs/specs/0003-containerize.md`. Reference: matthewmaynes.com `Dockerfile`,
`.dockerignore`, `docker-compose.yml`.

## Step 1 - .dockerignore

File: `.dockerignore`. Exclude `node_modules`, `.next`, `.git`, `.gitignore`, `npm-debug.log*`,
`Dockerfile`, `.dockerignore`, `docker-compose.yml`, `README.md`, `.env*` (keep `!.env.example`),
`coverage`, `context`, `.DS_Store`, `*.tsbuildinfo`, `.worktrees`.

## Step 2 - Dockerfile

File: `Dockerfile`, `# syntax=docker/dockerfile:1`. Three stages on `node:24-alpine`:
- `deps`: copy `package.json package-lock.json`, `npm ci`.
- `build`: copy node_modules from deps, copy source, `ENV NEXT_TELEMETRY_DISABLED=1`, `npm run build`.
- `runtime`: envs (`NODE_ENV=production`, `NEXT_TELEMETRY_DISABLED=1`, `HOSTNAME=0.0.0.0`,
  `PORT=3000`), `USER node`, copy `.next/standalone`, `.next/static`, `public` (`--chown=node:node`),
  `EXPOSE 3000`, `HEALTHCHECK` via node `fetch` on `/`, `CMD ["node","server.js"]`.

## Step 3 - docker-compose.yml

File: `docker-compose.yml`. `web` service: build `.`/`Dockerfile`, image `rogueoak-site`,
`ports: 3000:3000`, env `NODE_ENV=production` + `SITE_URL: https://rogueoak.com`,
`restart: unless-stopped`.

## Step 4 - Verify

- `docker build -t rogueoak-site .` (from repo root; `.dockerignore` keeps context lean).
- `docker run --rm -d -p 3000:3000 --name ro-test rogueoak-site`; wait; `curl -sf localhost:3000/`
  returns 200 and contains "Rogue Oak" + the three project names; `docker inspect` health = healthy;
  confirm process user is `node`. Stop the container.
- If Docker is unavailable in this environment, at minimum lint the Dockerfile (hadolint if present)
  and confirm `npm run build` still emits `.next/standalone/server.js` locally; note that the image
  build was not run.

## Step 5 - Commit, PR, review

- Conventional Commit, open PR.
- Persona review: security (non-root user, no secrets baked in, base image, healthcheck),
  architect (build stages, standalone shape, alignment with CI Node 24 and the release/deploy specs).
  engineer/tester: minimal surface (no app code), scope out unless warranted.
- Address findings, merge on green review.

## Reflect

- `overview/architecture.md` - record the container image shape (multi-stage node:24-alpine,
  standalone, non-root, healthcheck) and local compose.
