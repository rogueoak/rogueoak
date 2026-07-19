# Emails

Static, on-brand HTML emails for Rogue Oak. No build step - each file is standalone and ready to
create in the ESP (Constant Contact). The look mirrors the site: dark navy page, a raised-navy
header band with the Rogue Oak avatar, mist text, a green primary button, and a gold eyebrow.

- **`templates/welcome.html`** - the "thanks for subscribing" welcome (spec 0008). Personalize
  with `[[FIRSTNAME OR "there"]]`; the ESP injects the compliance / unsubscribe footer at send
  time.
- **`announcements/thought-stream.html`** - a one-off announcement for the Rogue Oak list: the
  Thought Stream app is coming (spec 0010). Features the app icon
  (`https://rogueoak.com/thought-stream-icon.png`) and links to the GitHub repo. Not personalized.

The template is table-based, Outlook-hardened (MSO ghost tables + a VML button), mobile-responsive,
and **dark by default** - Rogue Oak is a dark-only brand, so the email does not ship a light theme.
Brand colors come straight from `brand/rogueoak`: page `#0a0d13`, card `#131b26`, header `#1a2533`,
heading text `#eaf1f4`, body text `#c9d2da`, green button `#5fb98a` (with `#06131a` label), gold
eyebrow `#d2a463`.

## Publishing to Constant Contact

Create the campaign with the [`ctct`](https://github.com/mattmaynes/ctct-cli) CLI instead of pasting
into the dashboard. The sender must be a **verified** address on the account (`ctct account emails`);
Rogue Oak sends from `hello@rogueoak.com`:

```bash
ctct email create \
  --name "Rogue Oak Welcome Template" \
  --subject "Welcome to Rogue Oak" \
  --from-name "Rogue Oak" \
  --from-email hello@rogueoak.com \
  --preheader "Welcome to Rogue Oak. Here is what to expect, and where to start." \
  --html-file emails/templates/welcome.html
```

`create` prints a `campaign_id`. Preview it in your own inbox before sending:

```bash
ctct email test-send <campaign_id> --to <your-address>
ctct email send      <campaign_id>                # send now
```

## Notes

- **Images must use absolute `https://rogueoak.com/...` URLs** - relative paths do not resolve in an
  inbox. The header avatar is `https://rogueoak.com/rogueoak-avatar.png`, already served from the
  site. The Thought Stream announcement links `https://rogueoak.com/thought-stream-icon.png`
  (`public/thought-stream-icon.png`), so that image only resolves once this change deploys - create
  the campaign as a draft, and confirm the icon loads before sending. The footers use plain text
  links (no hosted icon PNGs), so nothing else can 404.
- **Campaign names must be unique**, and Constant Contact keeps reserving a name even after you
  delete the campaign. If `create` returns a `409 not unique`, keep `--subject` and pass a distinct
  `--name` (e.g. `--name "Rogue Oak Welcome Template (2026-07-13)"`).
- Emails are sent as **custom-code** (`format_type` 5) - Constant Contact auto-injects the required
  unsubscribe + physical-address footer at send time, so the template does not include one.
