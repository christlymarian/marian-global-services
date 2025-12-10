/**
 * js/sendQuoteClient.js
 * Non-destructive form handler for multiple forms across the site.
 *
 * It:
 * - Detects candidate quote/contact forms automatically (conservative rules).
 * - Adds a hidden form-name (if missing) and honeypot (bot-field).
 * - Submits via fetch to /.netlify/functions/send-quote (multipart/form-data).
 * - Shows an inline status message (does not modify original fields).
 *
 * Drop this file into js/ and include it site-wide (footer) so it runs on every page.
 */

(function () {
  // Config: change endpoint if you host function elsewhere
  const FUNCTION_ENDPOINT = '/.netlify/functions/send-quote';
  const MIN_FIELDSET = ['email', 'name']; // at least these must exist to be considered a contact form

  function isCandidateForm(form) {
    // Conservative detection:
    // Accept if form has input[name="email"] AND (textarea[name="details"] OR input[name="target_languages"] OR input[type="file"])
    const hasEmail = !!form.querySelector('input[name="email"], input[type="email"]');
    const hasName = !!form.querySelector('input[name="name"], input[id*="name"], input[placeholder*="Name"]');
    const hasDetails = !!form.querySelector('textarea[name="details"], textarea[id*="details"], input[name="target_languages"], input[name="target_language"]');
    const hasFile = !!form.querySelector('input[type="file"]');

    // Also allow explicit opt-in attribute data-netlify-function="send-quote"
    const explicit = form.getAttribute('data-netlify-function') === 'send-quote';

    return explicit || (hasEmail && (hasDetails || hasFile || hasName));
  }

  function ensureHiddenInputs(form) {
    // Add form-name if missing (non-destructive: we only add a hidden input at runtime)
    if (!form.querySelector('input[name="form-name"]')) {
      const hn = document.createElement('input');
      hn.type = 'hidden';
      hn.name = 'form-name';
      hn.value = form.getAttribute('id') || form.getAttribute('name') || 'quote-form';
      form.appendChild(hn);
    }

    // Add honeypot bot-field if missing
    if (!form.querySelector('input[name="bot-field"]')) {
      const hp = document.createElement('input');
      hp.type = 'text';
      hp.name = 'bot-field';
      hp.style.display = 'none';
      hp.tabIndex = -1;
      form.appendChild(hp);
    }
  }

  function createStatusNode(form) {
    // Add or reuse a status node near the submit button
    let status = form.querySelector('.form-status');
    if (!status) {
      status = document.createElement('div');
      status.className = 'form-status';
      status.setAttribute('aria-live', 'polite');
      // try to place after the last button or at the end of the form
      const lastBtn = form.querySelector('button[type="submit"], input[type="submit"]');
      if (lastBtn && lastBtn.parentNode) lastBtn.parentNode.insertBefore(status, lastBtn.nextSibling);
      else form.appendChild(status);
    }
    return status;
  }

  async function postFormDataAsFormData(url, formData) {
    const res = await fetch(url, {
      method: 'POST',
      body: formData
    });
    // attempt to parse JSON safely
    let json = null;
    try { json = await res.json(); } catch (e) { /* ignore */ }
    return { ok: res.ok, status: res.status, json };
  }

  function disableForm(form, disabled = true) {
    const controls = form.querySelectorAll('input, textarea, select, button');
    controls.forEach(el => (el.disabled = disabled));
  }

  function attachHandler(form) {
    if (form.__sendQuoteAttached) return; // idempotent
    form.__sendQuoteAttached = true;

    ensureHiddenInputs(form);
    const status = createStatusNode(form);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Simple bot check
      const botVal = (form.querySelector('input[name="bot-field"]') || {}).value;
      if (botVal) {
        // silently swallow
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
      const originalBtnText = submitBtn ? (submitBtn.innerText || submitBtn.value) : null;
      if (submitBtn) {
        submitBtn.disabled = true;
        if (submitBtn.tagName.toLowerCase() === 'button') submitBtn.innerText = 'Sending…';
      }
      status.textContent = 'Sending…';

      // Build FormData (keeps original names)
      const fd = new FormData(form);

      try {
        const result = await postFormDataAsFormData(FUNCTION_ENDPOINT, fd);
        if (result.ok) {
          status.textContent = (result.json && result.json.message) || 'Thank you — your request has been sent.';
          form.reset();
        } else {
          console.warn('Form submit failed', result);
          const errMsg = (result.json && (result.json.error || result.json.message)) || `Submit failed (${result.status})`;
          status.textContent = errMsg;
        }
      } catch (err) {
        console.error('Network/submit error', err);
        status.textContent = 'Network error — could not send the form.';
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          if (submitBtn.tagName.toLowerCase() === 'button' && originalBtnText) submitBtn.innerText = originalBtnText;
        }
        // auto-hide status after 10s
        setTimeout(() => { if (status) status.textContent = ''; }, 10000);
      }
    });
  }

  // Wait for DOM
  document.addEventListener('DOMContentLoaded', () => {
    const allForms = Array.from(document.querySelectorAll('form'));
    allForms.forEach(form => {
      try {
        if (isCandidateForm(form)) attachHandler(form);
      } catch (err) {
        console.error('sendQuoteClient attach error', err);
      }
    });

    // In case some forms are loaded late (AJAX), observe container for added forms
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(m => {
        m.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            if (node.tagName.toLowerCase() === 'form') {
              if (isCandidateForm(node)) attachHandler(node);
            } else {
              const nestedForms = Array.from(node.querySelectorAll ? node.querySelectorAll('form') : []);
              nestedForms.forEach(f => { if (isCandidateForm(f)) attachHandler(f); });
            }
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });

})();
