# Project

Rogue Oak's home base on the web (rogueoak.com) and the repository that hosts it. The site
introduces Rogue Oak, showcases its products - Spectra, Trellis, and Canopy - and tells the story of
the name.

Hosting mirrors matthewmaynes.com: a standalone container deployed to a DigitalOcean droplet behind
a Caddy edge proxy, with PostHog analytics. The repo is public, so no secrets are ever committed;
real values live in GitHub Actions secrets and on the host.

Roadmap: **0001 site** (done) -> **0002 PR CI** -> **0003 container** -> **0004 release pipeline**
-> **0005 DigitalOcean deploy**.
