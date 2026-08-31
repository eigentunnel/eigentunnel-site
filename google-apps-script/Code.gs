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

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
