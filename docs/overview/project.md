# Project

Rogue Oak's home base on the web (rogueoak.com) and the repository that hosts it. The site
introduces Rogue Oak, showcases its products - Spectra, Trellis, and Canopy - and tells the story of
the name.

Hosting mirrors matthewmaynes.com: a standalone container deployed to a DigitalOcean droplet behind
a Caddy edge proxy, with PostHog analytics. The repo is public, so no secrets are ever committed;
real values live in GitHub Actions secrets and on the host.

Roadmap (all shipped): **0001 site** -> **0002 PR CI** -> **0003 container** -> **0004 release
pipeline** -> **0005 DigitalOcean deploy** (zero-downtime) -> **0007 privacy policy** ->
**0008 subscribe**. The site builds, tests, containerizes, publishes to GHCR, and deploys to the
droplet automatically on every push to `main`, with no user-visible downtime. As of 0008 it also has a mailing list
(the "Rogue Oak" Constant Contact list) and its first server-side secret, injected on the host via a
git-ignored `.env.site`.
