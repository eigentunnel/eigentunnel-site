# Lead capture via Google Apps Script + Sheets

Replaces the earlier Formspree plan: form submissions on eigentunnel.com POST
straight to an Apps Script Web App, which appends a row to a Google Sheet in
the `eigentunnel.com` Workspace and emails `patrick@eigentunnel.com` per lead.
No third party holds the data.

You'll do this as the Workspace admin / owner of `patrick@eigentunnel.com`.
Takes about 10 minutes.

## 1. Create the Sheet

1. In Google Drive on the `eigentunnel.com` account, create a new Google
   Sheet. Name it something like **EigenTunnel Leads**.
2. Rename the first tab `Leads` (optional — the script creates it
   automatically with headers if it's missing, but naming it now avoids a
   stray default `Sheet1`).

## 2. Add the script

1. In the Sheet: **Extensions → Apps Script**. This opens a script bound to
   this specific spreadsheet — that binding is what lets it write to the
   sheet without extra auth setup.
2. Delete the default boilerplate in `Code.gs` and paste in the contents of
   [`Code.gs`](./Code.gs) from this folder.
3. Save the project (name it e.g. "EigenTunnel Leads").

## 3. Deploy as a Web App

1. Top right: **Deploy → New deployment**.
2. Click the gear icon next to "Select type" → **Web app**.
3. Settings:
   - **Execute as:** Me (`patrick@eigentunnel.com`)
   - **Who has access:** **Anyone**

   This has to be "Anyone," not "Anyone within eigentunnel.com" — the people
   filling out the form are visitors to your public website, not people
   signed into your Workspace.
4. Click **Deploy**. Google will ask you to authorize the script's access to
   Sheets and Gmail (to send the notification email) — approve it. You may
   see an "unverified app" warning since this is your own script; click
   **Advanced → Go to EigenTunnel Leads (unsafe)** to proceed. This warning
   is expected for scripts you wrote yourself and haven't submitted for
   Google's app review; it isn't a signal anything is wrong.
5. Copy the **Web app URL** it gives you. It looks like:
   `https://script.google.com/macros/s/AKfycb.../exec`

## 4. If your Workspace admin console blocks it

Some Workspace domains have a security setting that blocks Apps Script web
apps from being accessible to anonymous, non-domain users at all — if step 3
fails or the deployed URL 404s/403s for a logged-out visitor, check:

**Admin console → Security → API controls → App access control** (or
**Apps → Google Workspace → Apps Script** on older console layouts) and make
sure Apps Script web apps are allowed to be deployed with "Anyone" access.
Since you're the Workspace admin for eigentunnel.com, you have this setting
yourself — no ticket to file.

## 5. Wire it into the site

1. In this repo, replace every occurrence of
   `https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec` in
   `index.html` and `contact.html` with the Web app URL from step 3.
2. Commit and push.
3. Test: submit the form on the live site (or a local preview) and confirm a
   row appears in the **Leads** sheet and an email lands at
   `patrick@eigentunnel.com`.

## Updating the script later

If you edit `Code.gs` (in the Apps Script editor, or by copying updates from
this repo), the live URL does **not** pick up the change automatically:

- **Deploy → Manage deployments → pencil/edit icon → Version: New version →
  Deploy.** This keeps the same URL — nothing on the site needs to change.
- Only use **New deployment** (not "Manage deployments") if you want a
  different URL, which would also require updating the site's forms again.

## Quotas

Workspace accounts get 1,500 `MailApp` emails/day and effectively unlimited
Sheet writes for this volume — a lead form will never come close.
