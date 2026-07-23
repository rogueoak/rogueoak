# Project

Rogue Oak's home base on the web (rogueoak.com) and the repository that hosts it. The site is a
short pitch for Rogue Oak that routes visitors into dedicated pages: About (mission + the name
story), Tools (Spectra, Trellis, Canopy, each with its own page), Products (Thought Stream and
Branch Out Games, both coming soon, each with its own page), and Contact.

Hosting mirrors matthewmaynes.com: a standalone container deployed to a DigitalOcean droplet behind
a Caddy edge proxy, with PostHog analytics. The repo is public, so no secrets are ever committed;
real values live in GitHub Actions secrets and on the host.

Roadmap (all shipped): **0001 site** -> **0002 PR CI** -> **0003 container** -> **0004 release
pipeline** -> **0005 DigitalOcean deploy** (zero-downtime) -> **0007 privacy policy** ->
**0008 subscribe** -> **0010 language + coming soon** -> **0011 navigation + tool/product pages +
contact**. The site builds, tests, containerizes, publishes to GHCR, and deploys to the droplet
automatically on every push to `main`, with no user-visible downtime. As of 0008 it has a mailing
list (the "Rogue Oak" Constant Contact list); as of 0011 a Resend-backed contact form and a top-nav
multi-page structure, with all runtime secrets generated on deploy from GitHub Actions Secrets into a
git-ignored host `.env.site`.

Open before go-live (spec 0011): the About mission copy is a placeholder to be written, and the six
GitHub Actions Secrets must be set for the contact form and subscribe to work in production.
