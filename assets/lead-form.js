// Progressive-enhancement submit handler for the Google Apps Script lead
// intake endpoint (see google-apps-script/SETUP.md). Falls back to a normal
// form POST if fetch/JS is unavailable.
document.querySelectorAll('form[action*="script.google.com/macros"]').forEach(function (form) {
  var statusEl = form.querySelector('.form-status');
  var thanksEl = form.parentElement && form.parentElement.querySelector('.form-thanks');
  form.addEventListener('submit', function (e) {
    if (form.action.indexOf('YOUR_DEPLOYMENT_ID') !== -1) {
      // Endpoint not configured yet: let it fail loudly instead of pretending to work.
      return;
    }
    e.preventDefault();
    var submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    if (statusEl) {
      statusEl.textContent = '';
      delete statusEl.dataset.state;
    }
    var data = new FormData(form);
    fetch(form.action, { method: 'POST', body: data })
      .then(function (res) { return res.json(); })
      .then(function (json) {
        if (!json || !json.ok) {
          throw new Error((json && json.error) || 'Submission failed');
        }
        if (thanksEl) {
          form.hidden = true;
          thanksEl.hidden = false;
          if (form.parentElement) form.parentElement.classList.add('is-sent');
          var heading = thanksEl.querySelector('h3');
          if (heading) {
            heading.tabIndex = -1;
            heading.focus({ preventScroll: true });
          }
          var header = document.querySelector('header');
          var headerHeight = header ? header.getBoundingClientRect().height : 0;
          var panelTop = thanksEl.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({ top: Math.max(0, panelTop - headerHeight - 28), left: 0, behavior: 'instant' });
        } else if (statusEl) {
          statusEl.textContent = 'Message received. We\'ll reply soon.';
          statusEl.dataset.state = 'ok';
        }
      })
      .catch(function () {
        if (submitBtn) submitBtn.disabled = false;
        if (statusEl) {
          statusEl.textContent = 'We couldn\'t send your message. Your details are still in the form. Try again, or email patrick@eigentunnel.com.';
          statusEl.dataset.state = 'error';
          statusEl.tabIndex = -1;
          statusEl.focus({ preventScroll: true });
        }
      });
  });
});
