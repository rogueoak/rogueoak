# 0006 - Zero-downtime deploy (blue/green via docker-rollout)

## Problem

The deploy recreates a single fixed-name container in place: `docker compose up -d`
stops the running `rogueoak` container and starts the new one in its place (they share
`container_name: rogueoak`, so they cannot overlap). During that gap the matthewmaynes
Caddy proxy - which routes rogueoak.com to the `rogueoak` backend - has no live upstream,
so every push to `main` briefly 502s the site. This mirrors the issue matthewmaynes fixed
in its spec 0019; the two sites are cohosted and should deploy the same way.

## Outcome

A push to `main` deploys with no user-visible downtime: the new container comes up and
goes healthy alongside the old one, then the old is removed, and Caddy always routes to
whichever instance is live. A broken image fails the deploy while the old instance keeps
serving. The deploy pipeline is symmetric with matthewmaynes' (same rollout mechanics,
health gate, timeout, memory cap), differing only where it must - this repo never manages
the shared Caddy proxy.

## Scope

In:
- `compose.site.yml`: drop `container_name` so two Compose-indexed instances can coexist
  during a rollout (the service keeps the `rogueoak` network alias); add `mem_limit` /
  `mem_reservation` so a spike can't OOM the shared VM and take down matthewmaynes
  (matthewmaynes feedback 0015).
- `release.yml` deploy job: install the pinned, checksum-verified `docker-rollout` plugin
  (idempotent); replace `docker compose up -d --wait` with `docker rollout`; add a
  post-rollout end-to-end health gate (curl rogueoak.com through Caddy over loopback);
  add `timeout-minutes` so a wedged host fails fast. Keep the self-bootstrap clone,
  `git reset --hard`, the `edge`-network bootstrap, the pre-pull, and `prune -af`.
- Routing: the matthewmaynes repo (which owns the shared Caddyfile) switches the
  rogueoak.com block to a dynamic-A upstream that re-resolves the `rogueoak` alias - done
  in that repo, referenced here.

Out:
- Managing Caddy from this repo (matthewmaynes owns the shared edge proxy).
- A steady 2+ replicas for capacity; the second instance is transient during a rollout.
- Host provisioning (RAM/swap) - owned by the matthewmaynes operator runbook.

## Approach

Mirror matthewmaynes spec 0019 exactly. `docker-rollout` scales `rogueoak` to two
instances, waits for the new HEALTHCHECK, then removes the old; it is fail-safe (a broken
image never goes healthy, so the old keeps serving and the deploy fails) and performs the
one-time cutover from the legacy `container_name: rogueoak` container. The plugin is pinned
to a commit SHA and sha256-verified before it is made executable. The health gate curls
`https://rogueoak.com` via `--resolve rogueoak.com:443:127.0.0.1` (Caddy is owned by
matthewmaynes but runs on this host on 443), failing the deploy on a non-200 so a routing
misconfig can't ship a green 502. Caddy following the swap depends on the matthewmaynes
Caddyfile using dynamic-A upstreams for the `rogueoak` alias (0019 amendment).

Capacity: the rollout briefly doubles rogueoak's footprint; combined with matthewmaynes'
own overlaps, the host must hold it. It now has ~1GB + 2GB swap and per-service
`mem_limit`, sized after the matthewmaynes OOM incident (feedback 0015).

## Acceptance

- [ ] A poll of rogueoak.com through a real deploy returns only 200 (no 502) from before
      the deploy starts until after it completes; mid-rollout two `rogueoak-*` containers
      run concurrently, then collapse to one.
- [ ] `docker-rollout` is installed from a pinned source and checksum-verified before use
      (idempotent).
- [ ] `compose.site.yml` has no `container_name`, keeps the `rogueoak` alias, and sets
      `mem_limit`/`mem_reservation`.
- [ ] The deploy has a post-rollout end-to-end health gate (curl via loopback) that fails
      the deploy on non-200; and a `timeout-minutes` bound.
- [ ] The deploy job is structurally identical to matthewmaynes' except: it never manages
      Caddy, has no prewarm job, and uses rogueoak names/image.
- [ ] A pullable-but-unhealthy image fails the deploy while the old instance keeps serving.
- [ ] verify (lint/build/test) stays green (no app code changed).
