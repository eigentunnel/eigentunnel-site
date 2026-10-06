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
      storedMessage(params)
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

// Keep this marker identical to EIGENSCAN_MARKER in assets/lead-form.js.
var EIGENSCAN_MARKER = 'EigenScan request details';

function cleanField(value) {
  return value == null ? '' : String(value).trim();
}

// The live sheet has seven columns. Extra EigenScan request fields are folded
// into Message so a redeploy does not require a new header row. lead-form.js
// folds the same block before fetch; if that marker is already present, leave
// the message alone. A no-JS post is folded here after Code.gs is redeployed
// (Deploy → Manage deployments → New version). Same web app URL.
function storedMessage(p) {
  var message = cleanField(p.message);
  if (message.indexOf(EIGENSCAN_MARKER) === 0) return message;
  var requestType = cleanField(p.request_type);
  var role = cleanField(p.role);
  var sector = cleanField(p.sector);
  var segments = cleanField(p.segments);
  var timeframe = cleanField(p.timeframe);
  if (!requestType && !role && !sector && !segments && !timeframe) {
    return message;
  }
  var lines = [EIGENSCAN_MARKER];
  if (requestType) lines.push('Request: ' + requestType);
  if (role) lines.push('Role: ' + role);
  if (sector) lines.push('Sector: ' + sector);
  if (segments) lines.push('Approximate network segments or sites: ' + segments);
  if (timeframe) lines.push('Timeframe: ' + timeframe);
  lines.push('');
  lines.push('Notes:');
  lines.push(message || '(none)');
  return lines.join('\n');
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
    storedMessage(p) || '(none)'
  ].join('\n');
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
