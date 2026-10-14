/**
 * EigenTunnel lead intake.
 * Bound to the "EigenTunnel Leads" Google Sheet. Deployed as a Web App so the
 * public site (eigentunnel.com) can POST form submissions straight into the
 * sheet, with a notification email on each new lead.
 *
 * Setup: see google-apps-script/SETUP.md in the eigentunnel-site repo.
 */

var SHEET_NAME = 'Leads';
var NOTIFY_EMAIL = 'patrick@eigentunnel.com';

function doPost(e) {
  try {
    var params = (e && e.parameter) || {};

    // Honeypot: bots fill every field, humans never see this one.
    if (params._gotcha) {
      return jsonResponse({ ok: true });
    }

    if (!params.email) {
      return jsonResponse({ ok: false, error: 'Missing email' });
    }

    // Lossy-link funnel (lossy-links/index.html): brief + NDA forms.
    if (params.form === 'brief' || params.form === 'nda' || params.form === 'free') {
      return handleFunnel(params);
    }

    getSheet().appendRow([
      new Date(),
      params.source || '',
      params.name || '',
      params.email || '',
      params.company || '',
      params.interest || '',
      params.message || ''
    ]);

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: 'EigenTunnel: new lead — ' + (params.name || params.email),
      body: buildEmailBody(params)
    });

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function doGet() {
  return ContentService.createTextOutput('EigenTunnel lead intake endpoint. POST only.');
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Timestamp', 'Source', 'Name', 'Email', 'Company', 'Interest', 'Message']);
  }
  return sheet;
}

function buildEmailBody(p) {
  return [
    'New EigenTunnel lead:',
    '',
    'Name: ' + (p.name || '(not given)'),
    'Email: ' + p.email,
    'Company: ' + (p.company || '(not given)'),
    'Interest: ' + (p.interest || '(not given)'),
    'Source page: ' + (p.source || '(unknown)'),
    '',
    'Message:',
    p.message || '(none)'
  ].join('\n');
}

/* ---------- Lossy-link funnel: scoring, gated brief, NDA ---------- */

var FUNNEL_SHEET = 'Funnel';
var BOOK_CALL_URL = 'https://calendar.app.google/K5anZSkG7kXmQUEX6';
// The gated brief is NOT in this public repo. Set Script Property BRIEF_DOC_ID to the
// private Google Doc's ID (Project Settings > Script Properties). It is attached as a PDF.
function briefDocId() { return PropertiesService.getScriptProperties().getProperty('BRIEF_DOC_ID') || ''; }
// NDA e-sign: 'manual' (default stub), 'dropboxsign', 'docusign' or 'pandadoc'. See SETUP.md.
var NDA_PROVIDER = 'manual';

var FREE_MAIL = ['gmail.com','googlemail.com','yahoo.com','hotmail.com','outlook.com','live.com','msn.com',
  'aol.com','icloud.com','me.com','mac.com','proton.me','protonmail.com','gmx.com','gmx.net','mail.com',
  'yandex.com','zoho.com','hey.com','fastmail.com','tutanota.com','duck.com','comcast.net','att.net','verizon.net'];

function scoreLead(p) {
  var pts = 0, why = [];
  var domain = String(p.email || '').split('@')[1] || '';
  domain = domain.toLowerCase().trim();
  var isGov = /\.(mil|gov)$/.test(domain) || /\.(mil|gov)\.[a-z]{2}$/.test(domain);
  var isFree = FREE_MAIL.indexOf(domain) !== -1;
  if (isGov) { pts += 3; why.push('.mil/.gov domain +3'); }
  else if (isFree) { why.push('free-mail domain +0'); }
  else if (domain) { pts += 2; why.push('corporate domain +2'); }

  var role = String(p.role || '').toLowerCase();
  var senior = /\b(chief|c[etios]o|cfo|president|founder|owner|vp|vice president|director|head|general manager|program manager|pm|peo|portfolio|principal|colonel|col|commander|cdr|capt|captain|gs-1[45]|ses)\b/.test(role);
  var mid = /\b(manager|lead|architect|engineer|integrator|chief engineer|sme|scientist|officer)\b/.test(role);
  var junior = /\b(student|intern|trainee)\b/.test(role);
  if (senior) { pts += 2; why.push('senior role +2'); }
  else if (mid) { pts += 1; why.push('practitioner role +1'); }
  else if (junior) { pts -= 1; why.push('student/intern -1'); }

  var tl = { 'now': 3, '3mo': 2, '6-12mo': 1, 'exploring': 0 }[p.timeline];
  if (tl !== undefined) { pts += tl; why.push('timeline ' + p.timeline + ' +' + tl); }

  if (['tactical-radio','satellite','cat-m','rail'].indexOf(p.network) !== -1) { pts += 2; why.push('target network +2'); }
  if (/sensor|fusion|c2|command|isr|edge|uas|drone|radio|satcom|satellite|rail|ptc|wayside|post-quantum|pqc|quantum|cnsa|tactical|manet/i.test(p.use_case || '')) {
    pts += 1; why.push('use-case keywords +1');
  }
  if (p.form === 'nda') { pts += 3; why.push('NDA requested +3'); }
  if (p.gov_program === 'yes') { pts += 1; why.push('government program +1'); }
  var free = p.form === 'free' || hasPriorFreeSignup(p.email);
  if (free) { pts += 2; why.push('free sign-up +2'); }

  var tier = pts >= 9 ? 'strong' : pts >= 5 ? 'medium' : 'weak';
  // A .mil/.gov senior contact is strong even from the brief form.
  if (isGov && senior) tier = 'strong';
  // Free user who also requested the NDA is the strongest signal.
  if (free && (p.form === 'nda' || hasPriorNda(p.email))) { tier = 'strong'; why.push('free user + NDA'); }
  // Free mail is capped at medium.
  if (isFree && tier === 'strong') { tier = 'medium'; why.push('capped: free mail'); }
  return { tier: tier, points: pts, reasons: why, domain: domain };
}

function funnelRowsFor(email, form) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FUNNEL_SHEET);
  if (!sh || sh.getLastRow() < 2) return false;
  var rows = sh.getRange(2, 2, sh.getLastRow() - 1, 5).getValues(); // Form..Email
  email = String(email).toLowerCase();
  return rows.some(function (r) { return r[0] === form && String(r[4]).toLowerCase() === email; });
}
function hasPriorFreeSignup(email) { return funnelRowsFor(email, 'free'); }
function hasPriorNda(email) { return funnelRowsFor(email, 'nda'); }

function handleFunnel(p) {
  var s = scoreLead(p);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(FUNNEL_SHEET);
  if (!sh) {
    sh = ss.insertSheet(FUNNEL_SHEET);
    sh.appendRow(['Timestamp','Form','Tier','Points','Name','Email','Company','Role','Use case','Network','Timeline','Gov program','Reasons','NDA status','Free option']);
  }
  var ndaStatus = '';
  if (p.form === 'nda') ndaStatus = sendNdaForSignature(p);
  sh.appendRow([new Date(), p.form, s.tier, s.points, p.name || '', p.email, p.company || '', p.role || '',
    p.use_case || '', p.network || '', p.timeline || '', p.gov_program || '', s.reasons.join('; '), ndaStatus, p.free_option || '']);

  if (p.form === 'brief') sendBrief(p);
  // Free tier / hosted demo provisioning is a STUB: Patrick follows up manually until the
  // free-tier and demo-gateway backends exist (see SETUP.md). No core binary is handed out.

  var flag = s.tier === 'strong' ? '[STRONG LEAD] ' : '[' + s.tier + '] ';
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: flag + 'EigenTunnel ' + ({nda:'NDA request',brief:'brief download',free:'free sign-up (' + (p.free_option||'') + ')'}[p.form]) + ': ' + (p.name || p.email) + (p.company ? ' (' + p.company + ')' : ''),
    body: [
      'Tier: ' + s.tier.toUpperCase() + ' (' + s.points + ' pts)',
      'Why: ' + s.reasons.join('; '),
      '',
      'Form: ' + p.form, 'Name: ' + (p.name || ''), 'Email: ' + p.email, 'Company: ' + (p.company || ''),
      'Role: ' + (p.role || ''), 'Network: ' + (p.network || ''), 'Timeline: ' + (p.timeline || ''),
      'Government program: ' + (p.gov_program || ''), '', 'Use case:', p.use_case || '(n/a)',
      '', p.form === 'nda' ? 'NDA: ' + ndaStatus : ''
    ].join('\n')
  });
  return jsonResponse({ ok: true });
}

function sendBrief(p) {
  var id = briefDocId();
  var hi = 'Hi ' + (p.name || 'there') + ',\n\nThanks for your interest in EigenTunnel. ';
  var sig = '\n\nReply to this email or book a call any time: ' + BOOK_CALL_URL +
    '\n\nPatrick McCormick\nEigen-Systems, Inc.\nPatent pending (U.S. Application No. 64/175,794).';
  var opts = { to: p.email, replyTo: NOTIFY_EMAIL, name: 'Patrick McCormick, EigenTunnel',
    subject: 'Your EigenTunnel brief: Built for bad signal. Ready for quantum.' };
  if (id) {
    opts.attachments = [DriveApp.getFileById(id).getAs('application/pdf').setName('EigenTunnel-Lossy-Link-Brief.pdf')];
    opts.body = hi + 'Your brief is attached.' + sig;
  } else {
    // Not configured: tell the lead it is coming and ask Patrick to send it by hand.
    opts.body = hi + 'I will send your brief personally shortly.' + sig;
    MailApp.sendEmail({ to: NOTIFY_EMAIL, subject: 'ACTION: send lossy-link brief to ' + p.email,
      body: 'BRIEF_DOC_ID Script Property is not set. Send the brief to ' + p.email + ' by hand.' });
  }
  MailApp.sendEmail(opts);
}

// STUB. Replace with a real e-sign integration once Patrick picks a provider (see SETUP.md).
// Never put API keys in this repo: store them in Script Properties.
function sendNdaForSignature(p) {
  if (NDA_PROVIDER === 'manual') {
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: 'ACTION: send mutual NDA to ' + p.email,
      body: 'Send the Eigen-Systems mutual NDA for e-signature to ' + (p.name || '') + ' <' + p.email + '> at ' +
        (p.company || '') + '.\nNo e-sign provider is wired up yet (NDA_PROVIDER = manual).'
    });
    MailApp.sendEmail({
      to: p.email, replyTo: NOTIFY_EMAIL, name: 'Patrick McCormick, EigenTunnel',
      subject: 'EigenTunnel technical deep dive: next steps',
      body: 'Hi ' + (p.name || 'there') + ',\n\nThanks for requesting the EigenTunnel technical deep dive. ' +
        'Our mutual NDA will reach you for e-signature shortly. In the meantime, pick a time for the technical call: ' +
        BOOK_CALL_URL + '\n\nPatrick McCormick\nEigen-Systems, Inc.\nPatent pending (U.S. Application No. 64/175,794).'
    });
    return 'pending-manual';
  }
  // TODO: 'dropboxsign' -> POST https://api.hellosign.com/v3/signature_request/send_with_template
  // TODO: 'docusign'    -> Envelopes: create from template (JWT auth)
  // TODO: 'pandadoc'    -> POST /public/v1/documents from template, then /send
  throw new Error('NDA_PROVIDER ' + NDA_PROVIDER + ' not implemented yet');
}


function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
