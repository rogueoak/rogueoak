# 0004 - Release pipeline (publish the container image)

## Problem

Spec 0003 defines a container image, but nothing builds or publishes it. The deploy target (0005)
runs a prebuilt image pulled from a registry, so we need a pipeline that verifies, builds, and
pushes the image to a registry on every change to `main` - tagged so a deploy can pin an exact,
auditable version and roll back by changing one tag.

Audience: the deploy pipeline (0005), which pulls the published image; and maintainers auditing what
is running.

## Outcome

- On push to `main` (and manual `workflow_dispatch`): the shared **verify** gate runs, then - only
  if it passes - the container image is built and pushed to **GHCR** at
  `ghcr.io/rogueoak/rogueoak`.
- Each push publishes two tags: `latest` and `sha-<full-commit-sha>` (the sha tag is the stable,
  auditable handle a deploy pins).
- The image is built with `--build-arg SITE_URL=https://rogueoak.com` so the baked metadata is
  correct (per 0003: `SITE_URL` is a build-time value).
- Images carry OCI labels (incl. `org.opencontainers.image.source`) so later label-scoped pruning on
  the host and the retention job target only this project's images.
- A scheduled **retention** job prunes old GHCR versions so the package does not grow without bound.
- The build job is the first real `docker build` of the 0003 Dockerfile; a broken Dockerfile fails
  here.

## Scope

**In:**
- `.github/workflows/release.yml` - `on: push: branches:[main]` + `workflow_dispatch`; jobs:
  `verify` (reuses `verify.yml`) then `build` (build + push to GHCR).
- `.github/workflows/cleanup-images.yml` - scheduled GHCR retention (keep the 10 most recent tagged
  images), manual run defaults to a dry-run preview.
- Least-privilege permissions: default `contents: read`; only the `build` job gets `packages: write`.
- SHA-pinned actions (buildx, login, metadata, build-push, ghcr-cleanup); Dependabot already covers
  `github-actions` (0002).

**Out (later specs):**
- Deploying the image to the DigitalOcean droplet over SSH, the edge proxy, TLS (0005) - this spec
  stops at "image published to GHCR".
- The next/image prewarm step (mmc-specific; and it depends on deploy).
- Multi-arch (arm64) builds and image signing/attestation.

## Approach

Mirror matthewmaynes.com's `deploy.yml`, keeping only its `verify` and `build` jobs (drop `deploy`
and `prewarm` - those are 0005 and out of scope). Mirror `cleanup-images.yml` for retention.

- **`release.yml`**:
  - `permissions: contents: read` at the top; `concurrency: { group: release-main,
    cancel-in-progress: false }` (never push two image builds for the same branch at once, let an
    in-flight one finish).
  - `env.IMAGE: ghcr.io/${{ github.repository }}` (resolves to `ghcr.io/rogueoak/rogueoak`).
  - `verify` job: `uses: ./.github/workflows/verify.yml`.
  - `build` job: `needs: verify`, `permissions: { contents: read, packages: write }`. Steps:
    checkout -> `docker/setup-buildx-action` -> `docker/login-action` to `ghcr.io` with
    `github.actor` + `GITHUB_TOKEN` -> `docker/metadata-action` (tags `latest` + `type=sha,
    format=long`) -> `docker/build-push-action` (`context: .`, `platforms: linux/amd64`,
    `push: true`, `build-args: SITE_URL=https://rogueoak.com`, `tags`/`labels` from metadata,
    `no-cache: true`).
  - `no-cache: true`: mmc learned a cross-run gha cache can restore a stale `COPY . .` layer and ship
    old source; a clean build each run is the reliable default and this app builds in about a minute.
- **`cleanup-images.yml`**: scheduled daily (off-peak) + `workflow_dispatch` (dry-run default true);
  `permissions: { contents: read, packages: write }`; `dataaxiom/ghcr-cleanup-action` (SHA-pinned,
  referrer-aware) with `package: rogueoak`, `keep-n-tagged: 10`, `delete-untagged: true`,
  `delete-partial-images: true`.

## Acceptance

- [ ] The workflows are valid and parse; they reuse `verify.yml` (no duplicated gate).
- [ ] On push to `main`, `verify` runs first and `build` runs only if it passes.
- [ ] `build` pushes `ghcr.io/rogueoak/rogueoak:latest` and `:sha-<full-sha>` to GHCR.
- [ ] The image is built with `--build-arg SITE_URL=https://rogueoak.com`.
- [ ] `packages: write` is granted only to the `build` job; everything else is `contents: read`.
- [ ] All third-party actions are pinned to commit SHAs with version comments.
- [ ] `cleanup-images.yml` exists, runs on a schedule, prunes to the 10 most recent tagged images,
      and defaults a manual run to a dry-run preview.
- [ ] Merging this to `main` triggers a real image build (validating the 0003 Dockerfile) and a
      published image in GHCR.
