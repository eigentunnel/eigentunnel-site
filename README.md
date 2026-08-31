# EigenTunnel site

Public marketing site for **EigenTunnel**, the hybrid post-quantum overlay from Eigen Systems.

- Live site: https://eigentunnel.com
- Org: https://github.com/eigentunnel
- Contact: patrick@eigentunnel.com
- Book a call: https://calendar.app.google/K5anZSkG7kXmQUEX6

Previously marketed as FreeQ at getfreeq.com. That name collided with an unrelated influencer's site, so everything was renamed EigenTunnel. Product is unchanged; the brand is EigenTunnel.

## Pages

Static, multi-page, no build step:

- `index.html` &mdash; home
- `product.html` &mdash; Core vs. Cloud, cryptography, connectivity, install
- `pricing.html` &mdash; Core (free) / Cloud (pilot-priced) tiers, FAQ
- `about.html` &mdash; company, rename story, why-now
- `contact.html` &mdash; lead capture form + calendar booking
- `assets/style.css` &mdash; shared styles
- `assets/lead-form.js` &mdash; fetch-based submit handler for the Formspree forms

## Lead capture (Formspree)

The lead forms on `index.html` and `contact.html` post to Formspree so the site
can capture leads without a backend. **The form `action` URLs currently point
to a placeholder (`https://formspree.io/f/YOUR_FORM_ID`) and won't work until
you swap it in:**

1. Sign up free at https://formspree.io and create a form.
2. Copy the endpoint it gives you (looks like `https://formspree.io/f/abcdwxyz`).
3. Replace `YOUR_FORM_ID` in the `<form action="...">` attribute in both
   `index.html` and `contact.html`.
4. In the Formspree dashboard, set the notification email to
   `patrick@eigentunnel.com`.

Each form includes a honeypot field (`_gotcha`) for basic spam filtering,
which Formspree respects automatically.

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
