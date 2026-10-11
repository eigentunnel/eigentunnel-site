// Progressive-enhancement submit handler for the Google Apps Script lead
// intake endpoint (see google-apps-script/SETUP.md). Falls back to a normal
// form POST if fetch/JS is unavailable.
//
// EigenScan request fields (role, sector, segments, timeframe, request_type)
// are folded into `message` before fetch so the currently deployed script,
// which stores name / email / company / interest / message, still keeps them.
// Code.gs repeats the same fold for a no-JS post. Keep EIGENSCAN_MARKER in sync.

var EIGENSCAN_MARKER = 'EigenScan request details';

function interestKey(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function preselectInterest() {
  var params;
  try {
    params = new URLSearchParams(window.location.search);
  } catch (err) {
    return;
  }
  var wanted = interestKey(params.get('interest'));
  if (!wanted) return;
  document.querySelectorAll('select[name="interest"]').forEach(function (select) {
    for (var i = 0; i < select.options.length; i++) {
      var opt = select.options[i];
      var candidates = [opt.value, opt.text, opt.getAttribute('data-interest')];
      for (var j = 0; j < candidates.length; j++) {
        if (interestKey(candidates[j]) === wanted) {
          select.selectedIndex = i;
          return;
        }
      }
    }
  });
}

function fieldText(value) {
  return value == null ? '' : String(value).trim();
}

function syncEigenScanInterest(form) {
  var requestType = form.querySelector('[name="request_type"]');
  var interest = form.querySelector('input[name="interest"]');
  if (!requestType || !interest || !requestType.value) return;
  interest.value = 'EigenScan — ' + requestType.value;
}

function foldEigenScanRequest(data) {
  var requestType = fieldText(data.get('request_type'));
  var role = fieldText(data.get('role'));
  var sector = fieldText(data.get('sector'));
  var segments = fieldText(data.get('segments'));
  var timeframe = fieldText(data.get('timeframe'));
  if (!requestType && !role && !sector && !segments && !timeframe) return;
  var message = fieldText(data.get('message'));
  if (message.indexOf(EIGENSCAN_MARKER) === 0) return;
  var lines = [EIGENSCAN_MARKER];
  if (requestType) lines.push('Request: ' + requestType);
  if (role) lines.push('Role: ' + role);
  if (sector) lines.push('Sector: ' + sector);
  if (segments) lines.push('Approximate network segments or sites: ' + segments);
  if (timeframe) lines.push('Timeframe: ' + timeframe);
  lines.push('');
  lines.push('Notes:');
  lines.push(message || '(none)');
  data.set('message', lines.join('\n'));
}

preselectInterest();

document.querySelectorAll('form[action*="script.google.com/macros"]').forEach(function (form) {
  var statusEl = form.querySelector('.form-status');
  var requestType = form.querySelector('[name="request_type"]');
  if (requestType) {
    requestType.addEventListener('change', function () {
      syncEigenScanInterest(form);
    });
  }
  form.addEventListener('submit', function (e) {
    if (form.action.indexOf('YOUR_DEPLOYMENT_ID') !== -1) {
      // Endpoint not configured yet: let it fail loudly instead of pretending to work.
      return;
    }
    e.preventDefault();
    syncEigenScanInterest(form);
    var data = new FormData(form);
    foldEigenScanRequest(data);
    fetch(form.action, { method: 'POST', body: data })
      .then(function (res) { return res.json(); })
      .then(function (json) {
        if (!json || !json.ok) {
          throw new Error((json && json.error) || 'Submission failed');
        }
        form.reset();
        preselectInterest();
        if (statusEl) {
          statusEl.textContent = statusEl.getAttribute('data-ok') || 'Thanks — we got it. We\'ll reply from patrick@eigentunnel.com.';
          statusEl.dataset.state = 'ok';
        }
      })
      .catch(function () {
        if (statusEl) {
          statusEl.textContent = 'Something went wrong. Email patrick@eigentunnel.com directly instead.';
          statusEl.dataset.state = 'error';
        }
      });
  });
});
