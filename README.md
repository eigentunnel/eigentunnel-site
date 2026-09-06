# EigenTunnel site

Public marketing site for **EigenTunnel**, the post-quantum protected-path product from Eigen Systems.

- Live site: https://eigentunnel.com
- Org: https://github.com/eigentunnel
- Contact: patrick@eigentunnel.com
- Book a call: https://calendar.app.google/K5anZSkG7kXmQUEX6

Previously marketed as FreeQ at getfreeq.com. That name collided with an unrelated influencer's site, so public-facing work now uses EigenTunnel. The product packaging has also changed: Core Public is a minimal lab/review kernel, while private Core and EigenTunnel Cloud contain commercial functions.

## Pages

Static, multi-page, no build step:

- `index.html` &mdash; plain-language buyer homepage
- `executive.html` &mdash; executive business case and evaluation decision guide
- `product.html` &mdash; Core Public, private Core, Cloud, cryptography, connectivity, and claim boundaries
- `developers.html` &mdash; developer and test-lab access path
- `oem.html` &mdash; OEM and integrator licensing path
- `federal.html` &mdash; federal and regulated-program positioning
- `pricing.html` &mdash; access and licensing model
- `about.html` &mdash; company, rename story, why-now
- `contact.html` &mdash; lead capture form + calendar booking
- `assets/style.css` &mdash; shared styles
- `assets/lead-form.js` &mdash; fetch-based submit handler for the lead forms
- `google-apps-script/` &mdash; the Apps Script that receives form submissions

## Lead capture (Google Apps Script + Sheets)

The lead forms on `index.html` and `contact.html` post to a Google Apps
Script Web App that appends each submission to a Google Sheet in the
`eigentunnel.com` Workspace and emails `patrick@eigentunnel.com`. No third
party holds lead data.

**The form `action` URLs currently point to a placeholder**
(`https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec`) **and won't
work until it's deployed and swapped in.** Full setup instructions (10
minutes, done once as the Workspace admin) are in
[`google-apps-script/SETUP.md`](./google-apps-script/SETUP.md).

Each form includes a honeypot field (`_gotcha`) for basic spam filtering,
handled in `google-apps-script/Code.gs`.

## GitHub Pages

Repo settings: https://github.com/eigentunnel/eigentunnel-site/settings/pages

- Source: Deploy from a branch
- Branch: `main` / `/` (root)
- Custom domain: `eigentunnel.com` (see `CNAME`)
- Enable **Enforce HTTPS** after GitHub issues the cert

Project Pages URL: https://eigentunnel.github.io/eigentunnel-site/

`www` DNS should CNAME to `eigentunnel.github.io`.

Keep getfreeq.com as a redirect to eigentunnel.com until search traffic dies off.

## Local preview

Open `index.html` in a browser. No build step.
