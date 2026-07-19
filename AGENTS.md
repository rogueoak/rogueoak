
<!-- trellis:start -->
## Trellis conventions

This repo follows **Trellis** - rogueoak's shared rules for AI agents. Read the rules in
`docs/rules/` and follow them on every change:

- **`docs/rules/guidelines.md`** - how to write and ship: ASCII-only text, and code that passes
  tests, lint, and build before it merges.
- **`docs/rules/conventions.md`** - how code itself is written (APIs versioned in the URL path).
- **`docs/rules/language.md`** - the voice for anything public-facing (READMEs, docs, release
  notes, user-facing strings).

Pull updates with `/trellis-update`.
<!-- trellis:end -->

<!-- spectra:start -->
## Spectra protocol

This repo uses **Spectra** - spec-driven development with learning feedback loops.
Read `docs/spectra/protocol.md` and follow it for every change:

- **Trivial** change → implement directly. **Feature** → spec in `docs/specs/` (get
  approval first). **Bug/feedback** → doc in `docs/feedback/`.
- Multi-step work → a plan in `docs/plans/`, built in a worktree, **tested before commit**,
  reviewed by the personas in `docs/spectra/personas/` via PR comments, merged on approval.
- **Before concluding, reflect**: update the relevant `docs/overview/` living docs
  (`project`, `features`, `architecture`, `learnings`).
<!-- spectra:end -->

## Email (Constant Contact)

When creating a Rogue Oak email with the `ctct` CLI, always set the footer organization name to
**"Rogue Oak"** on the campaign activity (`physical_address_in_footer.organization_name`) before
sending. The Constant Contact account is shared across brands and its account-wide org name is
"Matthew Maynes", so the CAN-SPAM footer defaults to that unless you override it per-email. It is
easy to forget. See `emails/README.md` for the full publishing steps.
