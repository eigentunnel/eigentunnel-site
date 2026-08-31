// Progressive-enhancement submit handler for the Google Apps Script lead
// intake endpoint (see google-apps-script/SETUP.md). Falls back to a normal
// form POST if fetch/JS is unavailable.
document.querySelectorAll('form[action*="script.google.com/macros"]').forEach(function (form) {
  var statusEl = form.querySelector('.form-status');
  form.addEventListener('submit', function (e) {
    if (form.action.indexOf('YOUR_DEPLOYMENT_ID') !== -1) {
      // Endpoint not configured yet: let it fail loudly instead of pretending to work.
      return;
    }
    e.preventDefault();
    var data = new FormData(form);
    fetch(form.action, { method: 'POST', body: data })
      .then(function (res) { return res.json(); })
      .then(function (json) {
        if (!json || !json.ok) {
          throw new Error((json && json.error) || 'Submission failed');
        }
        form.reset();
        if (statusEl) {
          statusEl.textContent = 'Thanks — we got it. We\'ll reply from patrick@eigentunnel.com.';
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
