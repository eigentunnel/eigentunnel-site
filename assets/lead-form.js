// Progressive-enhancement submit handler for Formspree forms.
// Falls back to a normal form POST + redirect if fetch/JS is unavailable.
document.querySelectorAll('form[action*="formspree.io"]').forEach(function (form) {
  var statusEl = form.querySelector('.form-status');
  form.addEventListener('submit', function (e) {
    if (form.action.indexOf('YOUR_FORM_ID') !== -1) {
      // Endpoint not configured yet: let it fail loudly instead of pretending to work.
      return;
    }
    e.preventDefault();
    var data = new FormData(form);
    fetch(form.action, {
      method: 'POST',
      body: data,
      headers: { Accept: 'application/json' }
    })
      .then(function (res) {
        if (res.ok) {
          form.reset();
          if (statusEl) {
            statusEl.textContent = 'Thanks — we got it. We\'ll reply from patrick@eigentunnel.com.';
            statusEl.dataset.state = 'ok';
          }
        } else {
          throw new Error('Form submission failed');
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
