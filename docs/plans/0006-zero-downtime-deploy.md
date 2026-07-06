# Plan 0006 - Zero-downtime deploy (blue/green via docker-rollout)

Source spec: `docs/specs/0006-zero-downtime-deploy.md`. Mirrors matthewmaynes spec 0019 +
feedback 0015. No app code changes - deploy pipeline, compose, docs only.

Pinned tool: `docker-rollout` v0.13, commit `39b8066d56cc1edc76d1ae898db46623cc93bc24`,
sha256 `fa0df004de84747142cb627c55210aaa914bbae76666e7b95a2ac46805d81a84`.

## Step 1 - compose.site.yml
- Remove `container_name: rogueoak` (indexed instances can then coexist; the service keeps
  the `rogueoak` alias). Add a comment mirroring matthewmaynes' compose.
- Add `mem_limit: 400m` / `mem_reservation: 192m` with a feedback-0015 comment.

## Step 2 - release.yml deploy job
- Add `timeout-minutes: 12` to the deploy job.
- In the remote heredoc, after the pre-pull: install the pinned + checksum-verified
  docker-rollout (idempotent, tempfile + trap + verify-then-exec); replace
  `docker compose up -d --wait` with
  `docker rollout -t 90 --wait-after-healthy 5 -f deploy/docker/compose.site.yml rogueoak`;
  add a post-rollout health gate (`curl --resolve rogueoak.com:443:127.0.0.1
  https://rogueoak.com`, 10 retries, `exit 1` on failure). Keep clone-if-missing, git reset,
  `edge` bootstrap, and `prune -af`. Do NOT add any Caddy management.

## Step 3 - Routing (matthewmaynes repo, referenced)
- The rogueoak.com Caddy block uses dynamic-A upstreams for the `rogueoak` alias (0019
  amendment). Landed in matthewmaynes BEFORE this deploy ships, so Caddy follows the swap.

## Step 4 - Docs
- `docs/overview/architecture.md`: the blue/green rollout, dynamic routing (owned by
  matthewmaynes), capacity/mem_limit.
- `docs/overview/learnings.md`: the cohost capacity lesson (a rollout doubles the footprint;
  the shared host must hold both sites' overlaps).

## Step 5 - Verify
- `npm run lint`, `npm run build`, `npm test` (if present) stay green (no app code changed).
- `release.yml` YAML parses; `docker compose config` valid without container_name (host).
- Live (after merge, matthewmaynes routing already live): poll rogueoak.com through a real
  deploy - only 200s; two `rogueoak-*` instances overlap then collapse to one. Host-verified
  with a manual rollout first (as matthewmaynes was), given the earlier OOM incident.

## Step 6 - PR + review + merge
- PR against `main`; personas by facet (architect: topology/cutover; security: pinned
  host-run plugin; engineer: deploy shell; tester: verification). Merge on approval, AFTER
  the matthewmaynes routing PR is live.
