# 0004 - Build plan: release pipeline

Source spec: `docs/specs/0004-release.md`. Reference: matthewmaynes.com
`.github/workflows/deploy.yml` (verify + build jobs) and `cleanup-images.yml`.

## Step 1 - release.yml

File: `.github/workflows/release.yml`.
- `name: release`; `on: push: branches:[main]` + `workflow_dispatch: {}`.
- `permissions: contents: read`; `concurrency: { group: release-main, cancel-in-progress: false }`.
- `env: IMAGE: ghcr.io/${{ github.repository }}`.
- Job `verify`: `uses: ./.github/workflows/verify.yml`.
- Job `build`: `needs: verify`, `runs-on: ubuntu-latest`,
  `permissions: { contents: read, packages: write }`. Steps: checkout -> setup-buildx ->
  login-action (ghcr.io, `github.actor` / `GITHUB_TOKEN`) -> metadata-action (tags `latest` +
  `type=sha,format=long`) -> build-push-action (`context: .`, `platforms: linux/amd64`,
  `push: true`, `build-args: SITE_URL=https://rogueoak.com`, tags/labels from metadata,
  `no-cache: true`).
- SHA-pin every action with a version comment (reuse the sibling repo's known-good pins).

## Step 2 - cleanup-images.yml

File: `.github/workflows/cleanup-images.yml`.
- `on: schedule: [cron "17 4 * * *"]` + `workflow_dispatch` with a `dry_run` boolean (default true).
- `permissions: { contents: read, packages: write }`; `concurrency: cleanup-images`.
- `dataaxiom/ghcr-cleanup-action` (SHA-pinned): `package: rogueoak`, `keep-n-tagged: 10`,
  `delete-untagged: true`, `delete-partial-images: true`, `dry-run: ${{ inputs.dry_run || false }}`,
  `token: ${{ secrets.GITHUB_TOKEN }}`.

## Step 3 - Verify

- YAML parses; the referenced `verify.yml` exists on the branch (it is on main from 0002).
- actionlint if available.
- The real end-to-end test (docker build + push to GHCR) can only run once merged to `main`, since
  `release.yml` triggers on push to main. Note this in the PR; the CI `verify` check still runs on
  the PR itself. After merge, confirm the run is green and the image + tags appear in GHCR.

## Step 4 - Commit, PR, review

- Conventional Commit, open PR.
- Persona review: security (packages:write scoping, SHA pins, GITHUB_TOKEN usage, delete-capable
  cleanup action, no secret leakage), architect (reuse of verify.yml, job graph, image naming,
  SITE_URL build arg wiring, retention design). engineer/tester: minimal (no app code), scope out.
- Address findings, merge on green review.

## Reflect

- `overview/architecture.md` - record the release pipeline (build+push to GHCR on push to main,
  tags, SITE_URL build arg) and GHCR retention.
- If a real learning emerges (e.g. from the first live build), add to `overview/learnings.md`.
