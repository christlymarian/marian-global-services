/**
 * main.js
 * Marian Global Services - UI + form handling (safe version)
 *
 * Features:
 * - Hamburger menu toggle
 * - IntersectionObserver reveal
 * - Sticky "Get Quote" button
 * - Client-side form validation (name, email)
 * - Fetch POST to local server at /send-quote
 * - File name preview for file input
 * - Simple acknowledgement simulation (keeps console logs)
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- Hamburger Menu ---
  const navToggle = document.querySelector('.nav-toggle-btn');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    const toggleNav = () => {
      navToggle.classList.toggle('open');
      navLinks.classList.toggle('active');
      const isExpanded = navToggle.classList.contains('open');
      navToggle.setAttribute('aria-expanded', isExpanded);
      document.body.style.overflow = isExpanded ? 'hidden' : '';
    };
    navToggle.addEventListener('click', toggleNav);

    // Close nav on link click (mobile)
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768 && navToggle.classList.contains('open')) {
          toggleNav();
        }
      });
    });
  }

  // --- File name preview ---
  const fileInput = document.getElementById('file_upload');
  const fileNameDisplay = document.getElementById('file-name-display');
  if (fileInput && fileNameDisplay) {
    fileInput.addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) {
        fileNameDisplay.textContent = f.name;
        fileNameDisplay.style.color = '#222'; // ensure visible
      } else {
        fileNameDisplay.textContent = 'No file chosen';
        fileNameDisplay.style.color = '#222';
      }
    });
  }

    // --- Form submission & validation ---
  document.querySelectorAll('.contact-form').forEach(contactForm => {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const form = e.target;
      const formElements = form.elements;
      let isValid = true;

      const nameField = form.querySelector('input[name="name"]');
      const emailField = form.querySelector('input[name="email"]');

      // robust email regex (simple)
      const emailRegex = /\S+@\S+\.\S+/;

      if (!nameField || !nameField.value.trim()) {
        alert('Please enter your name.');
        nameField && nameField.focus();
        isValid = false;
      }

      if (!emailField || !emailRegex.test(emailField.value.trim())) {
        alert('Please enter a valid email address.');
        emailField && emailField.focus();
        isValid = false;
      }

      if (!isValid) return;

      const submitButton = e.submitter || form.querySelector('button[type="submit"]');
      let _mgs_original_btn_text = null;
      if (submitButton) {
        _mgs_original_btn_text = submitButton.textContent;
        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;
      }

      // build payload (text fields only) and include country code & phone if present
      const payload = {
        name: nameField.value.trim(),
        email: emailField.value.trim(),
        company: (formElements.company && formElements.company.value) || '',
        country_code: (formElements.country_code && formElements.country_code.value) || '',
        phone: (formElements.phone && formElements.phone.value) || '',
        target_lang: (formElements.target_lang && formElements.target_lang.value) || '',
        message: (formElements.message && formElements.message.value) || ''
      };

      // If there's a file, we should send as FormData (server must support it).
      // We'll attempt FormData if a file is present so attachments work.
      const fileField = form.querySelector('input[type="file"][name="file_upload"]');
      let fetchOptions = {};
      if (fileField && fileField.files && fileField.files.length > 0) {
        // Use FormData to send file + fields
        const fd = new FormData();
        fd.append('file_upload', fileField.files[0]);
        Object.keys(payload).forEach(k => fd.append(k, payload[k]));
        fetchOptions = { method: 'POST', body: fd };
      } else {
        // Send JSON wrapped under "form" so server expects body.form.*
        fetchOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ form: payload })
        };
      }

      // Endpoint — local test server (adjust if your server runs on another port)
      const endpoint = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:4000/send-quote'
        : '/.netlify/functions/send-quote';

      fetch(endpoint, fetchOptions)
        .then(res => {
          // if FormData was used, server may return non-json; attempt to parse safely
          const ct = res.headers.get('content-type') || '';
          if (ct.indexOf('application/json') !== -1) return res.json();
          return res.text().then(t => ({ success: res.ok, text: t }));
        })
        .then(data => {
          // Accept both {success: true} or simple response text
          const ok = (data && (data.success === true || data.success === 'true')) ||
                     (typeof data === 'object' && Object.keys(data).length > 0 && data.success !== false) ||
                     (typeof data === 'string' && data.length > 0);

          if (ok) {
            alert('Thank you! Your request has been sent successfully.');
            form.reset();
            // reset file name display if present
            const fileNameDisplay = document.getElementById('file-name-display');
            if (fileNameDisplay) fileNameDisplay.textContent = 'No file chosen';
          } else {
            const err = (data && data.error) ? data.error : (data && data.text) ? data.text : 'Unknown server response';
            alert('Error: ' + err);
          }
        })
        .catch(err => {
          console.error('Form submit error', err);
          alert('Server error — please try again later.');
        })
        .finally(() => {
          if (submitButton) {
            submitButton.textContent = _mgs_original_btn_text || 'Request a Custom Quote';
            submitButton.disabled = false;
          }
        });

    });
  });


  // --- Simulated acknowledgment (keeps the previous console output behavior) ---
  function simulateAcknowledgment(userName) {
    const emailBody = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #0F1D3C;">Thank You for contacting Marian Global Services, ${userName}!</h2>
        <p>We've successfully received your request. Our specialized technical team will review your requirements and get back to you within <strong>24 to 48 working hours.</strong></p>
        <div style="margin-top: 30px; text-align: center;">
          <a href="https://www.marianglobalservices.com" style="background-color: #FFC300; color: #1A1A1A; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: 600;">Explore Our Services</a>
        </div>
        <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;">
        <p style="font-size: 0.8rem; color: #666; text-align: center;">This is an automated acknowledgment — please do not reply to this email.</p>
        <p style="font-size: 0.75rem; color: #999; text-align: center;">&copy; ${new Date().getFullYear()} Marian Global Services. All rights reserved.</p>
      </div>
    `;
    console.log("--- SIMULATED ACKNOWLEDGMENT EMAIL (Sent to User) ---");
    console.log("Target: user's submitted email address");
    console.log(emailBody);
    console.log("-----------------------------------------------------");
  }

  // --- Intersection Observer reveal for .section ---
  const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
  const sectionObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        if (!entry.target.classList.contains('sticky-quote-btn')) {
          observer.unobserve(entry.target);
        }
      } else {
        if (entry.target.classList.contains('sticky-quote-btn')) {
          entry.target.classList.remove('is-visible');
        }
      }
    });
  }, observerOptions);
  document.querySelectorAll('.section').forEach(section => sectionObserver.observe(section));

  // --- Sticky Quote Button visibility ---
  const stickyBtn = document.querySelector('.sticky-quote-btn');
  if (stickyBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400 && window.innerWidth > 768) {
        stickyBtn.classList.add('show');
      } else {
        stickyBtn.classList.remove('show');
      }
    });
  }

  // --- Smooth internal anchor scroll (only for hash links) ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (ev) {
      const href = this.getAttribute('href');
      if (href && href.startsWith('#')) {
        const targetElement = document.querySelector(href);
        if (targetElement) {
          ev.preventDefault();
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });
});
/* ===== MGS Mobile menu behaviour (REPLACE old mgs script if present) ===== */
(function(){
  const btn = document.getElementById('mgs-hamburger');
  const panel = document.getElementById('mgs-mobile-panel');
  const backdrop = document.getElementById('mgs-backdrop');
  if (!btn || !panel || !backdrop) return;

  function openPanel() {
  btn.classList.add('open');
  btn.setAttribute('aria-expanded','true');
  panel.classList.add('open');
  panel.setAttribute('aria-hidden','false');
  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
  // ensure the hamburger sits above everything while open
  btn.style.zIndex = '12030';
}
function closePanel() {
  btn.classList.remove('open');
  btn.setAttribute('aria-expanded','false');
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden','true');
  backdrop.classList.remove('open');
  document.body.style.overflow = '';
  // reset hamburger z-index to stylesheet default
  btn.style.zIndex = '';
}


  btn.addEventListener('click', function(e){
    e.preventDefault();
    panel.classList.contains('open') ? closePanel() : openPanel();
  });

  backdrop.addEventListener('click', closePanel);
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && panel.classList.contains('open')) closePanel(); });

  panel.addEventListener('click', function(e){
    const a = e.target.closest('a');
    if (!a) return;
    e.preventDefault();
    const href = a.getAttribute('href') || a.dataset.navTarget;
    if (!href) { closePanel(); return; }
    if (href.startsWith('#')) {
      closePanel();
      const el = document.querySelector(href);
      if (el) setTimeout(()=> el.scrollIntoView({behavior:'smooth', block:'start'}), 200);
    } else {
      // navigate away
      closePanel();
      window.location.href = href;
    }
  });

  document.addEventListener('DOMContentLoaded', function(){
    const selectors = ['#contact-form', '#contact-form-main', '.contact-form', 'form.contact', 'form#quote-form', 'form#contact'];
    let contact = null;
    for (const s of selectors) contact = contact || document.querySelector(s);
    if (contact && window.innerWidth <= 768) contact.classList.add('mgs-contact-center');

    window.addEventListener('resize', function(){
      if (!contact) return;
      if (window.innerWidth <= 768) contact.classList.add('mgs-contact-center');
      else contact.classList.remove('mgs-contact-center');
    });

    // file name preview
    const fileInput = document.getElementById('file_upload');
    const fname = document.getElementById('file-name-display');
    if (fileInput && fname) fileInput.addEventListener('change', function(){ const file = fileInput.files && fileInput.files[0]; fname.textContent = file ? file.name : 'No file chosen'; });
  });

})();
/* ===== MGS: Sync mobile hamburger menu with desktop nav-links (site-wide) ===== */
(function syncMobilePanelWithNav(){
  function build() {
    const desktopNav = document.querySelector('.nav-links');
    const mobilePanel = document.getElementById('mgs-mobile-panel');

    if (!desktopNav || !mobilePanel) return;

    // Gather desktop links (only visible top nav items)
    const links = Array.from(desktopNav.querySelectorAll('a')).map(a => {
      return {
        href: a.getAttribute('href') || a.dataset.navTarget || '#',
        text: (a.textContent || a.getAttribute('aria-label') || 'Link').trim(),
        target: a.target || ''
      };
    });

    // If no links found, do nothing
    if (!links.length) return;

    // Remove any old <ul> to avoid duplicates
    const oldUl = mobilePanel.querySelector('ul');
    if (oldUl) oldUl.remove();

    // Keep or set header title
    let titleEl = mobilePanel.querySelector('h3');
    if (!titleEl) {
      titleEl = document.createElement('h3');
      titleEl.textContent = 'Menu';
      mobilePanel.insertBefore(titleEl, mobilePanel.firstChild);
    } else {
      // If the header is not descriptive, set to 'Menu'
      if (!titleEl.textContent.trim()) titleEl.textContent = 'Menu';
    }

    // Build new list from desktop links
    const newUl = document.createElement('ul');
    links.forEach(link => {
      const li = document.createElement('li');
      const a = document.createElement('a');

      a.textContent = link.text;
      a.href = link.href;
      if (link.target) a.target = link.target;

      // If the href is an anchor (same page), add data-nav-target for existing panel JS
      if (typeof link.href === 'string' && link.href.startsWith('#')) a.setAttribute('data-nav-target', link.href);

      li.appendChild(a);
      newUl.appendChild(li);
    });

    mobilePanel.appendChild(newUl);

    // OPTIONAL: make sure mobile-panel links close panel on click (if panel exists and MGS actions present)
    // This mirrors earlier behavior: close panel then scroll or navigate
    newUl.addEventListener('click', function(e){
      const a = e.target.closest('a');
      if (!a) return;
      // Use same logic as MGS panel handler if present
      const href = a.getAttribute('href') || a.dataset.navTarget;
      // If the panel has open/close functions already in your MGS script, they will execute.
      // Here we do nothing else — MGS click handler should handle navigation/close.
    }, { passive: true });

  }

  // Run once after DOM is ready; small delay ensures other scripts' nav rendering is done.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(build, 20); });
  } else {
    setTimeout(build, 20);
  }
})();
/* ===== MGS small cleanup: ensure mobile panel inactive on desktop ===== */
(function mgsDesktopCleanup(){
  function tidy() {
    const isDesktop = window.innerWidth > 768;
    const btn = document.getElementById('mgs-hamburger');
    const panel = document.getElementById('mgs-mobile-panel');
    const backdrop = document.getElementById('mgs-backdrop');

    if (isDesktop) {
      if (btn) {
        btn.classList.remove('open');
        btn.style.zIndex = '';
        btn.style.display = '';
      }
      if (panel) {
        panel.classList.remove('open');
        panel.setAttribute('aria-hidden','true');
        panel.style.transform = '';
        panel.style.display = '';
      }
      if (backdrop) {
        backdrop.classList.remove('open');
        backdrop.setAttribute('aria-hidden','true');
        backdrop.style.display = '';
      }
      // restore body scroll if it was locked
      document.body.style.overflow = '';
    }
  }

  // Run on load and on resize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tidy);
  } else {
    tidy();
  }
  window.addEventListener('resize', tidy);
})();
/* Defensive: ensure mobile backdrop isn't accidentally blocking clicks */
(function ensureBackdropSafe(){
  function tidyBackdrop() {
    const back = document.getElementById('mgs-backdrop');
    if (!back) return;
    // If it doesn't have .open, ensure pointer-events is disabled
    if (!back.classList.contains('open')) {
      back.style.pointerEvents = 'none';
      back.setAttribute('aria-hidden','true');
    } else {
      back.style.pointerEvents = '';
      back.setAttribute('aria-hidden','false');
    }
  }

  // Run once and on resize (safe, cheap)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tidyBackdrop);
  } else {
    tidyBackdrop();
  }
  window.addEventListener('resize', tidyBackdrop);
  // also observe class changes to the backdrop to toggle pointer-events reliably
  const backEl = document.getElementById('mgs-backdrop');
  if (backEl && window.MutationObserver) {
    const obs = new MutationObserver(tidyBackdrop);
    obs.observe(backEl, { attributes: true, attributeFilter: ['class'] });
  }
})();
/* ===== Footer-link safety & href-normalizer (site-wide) ===== */
(function ensureFooterLinksWork(){
  function normalizeAndBind() {
    // 1) Normalize hrefs in footer anchors (remove accidental leading slashes)
    const footer = document.querySelector('.site-footer');
    if (!footer) return;

    const anchors = Array.from(footer.querySelectorAll('a[href]'));
    anchors.forEach(a => {
      // normalize href to plain relative filename if same-folder file expected
      const h = a.getAttribute('href') || '';
      // If href is like "/privacy.html" -> convert to "privacy.html"
      const normalized = h.replace(/^\/+/, '');
      if (normalized !== h) a.setAttribute('href', normalized);

      // 2) Defensive click handler: if any script prevents default, fallback to hard navigation
      a.addEventListener('click', function(e){
        // if default prevented elsewhere, ignore and force navigation
        // but allow normal navigation to proceed if nothing blocked it
        setTimeout(() => {
          // if the document did not navigate away (still here), then force location
          // We check if location.href still contains current page file name; simple heuristic
          // Use the anchor's href (relative) to navigate in same folder
          try {
            const href = a.getAttribute('href') || '';
            if (!href) return;
            // Build absolute URL from current location + relative href
            const cur = window.location.href.split('#')[0].split('?')[0];
            // If current URL already ends with the target, do nothing
            if (cur.endsWith(href)) return;
            // Otherwise force navigation
            window.location.href = href;
          } catch (err) {
            // ignore errors
            console.error('Footer navigation fallback error', err);
          }
        }, 150); // small delay gives other handlers time to run
      }, { passive: true });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', normalizeAndBind);
  } else {
    normalizeAndBind();
  }

  // Also re-run after navigation changes or if site modifies footer later:
  window.addEventListener('resize', normalizeAndBind);
})();
/* ===== MGS: ensure contact forms have country code + phone on all pages ===== */
(function ensureCountryPhoneFields(){
  const formSelectors = ['#contact-form', '#contact-form-main', '.contact-form', 'form.contact', 'form#quote-form', 'form#contact'];
  const countryOptions = [
    ['+91','🇮🇳 +91 India'],
    ['+1','🇺🇸 +1 United States'],
    ['+1_ca','🇨🇦 +1 Canada'],
    ['+44','🇬🇧 +44 United Kingdom'],
    ['+61','🇦🇺 +61 Australia'],
    ['+64','🇳🇿 +64 New Zealand'],
    ['+65','🇸🇬 +65 Singapore'],
    ['+60','🇲🇾 +60 Malaysia'],
    ['+971','🇦🇪 +971 UAE'],
    ['+974','🇶🇦 +974 Qatar'],
    ['+966','🇸🇦 +966 Saudi Arabia'],
    ['+81','🇯🇵 +81 Japan'],
    ['+82','🇰🇷 +82 South Korea'],
    ['+86','🇨🇳 +86 China'],
    ['+49','🇩🇪 +49 Germany'],
    ['+33','🇫🇷 +33 France'],
    ['+39','🇮🇹 +39 Italy'],
    ['+34','🇪🇸 +34 Spain'],
    ['+31','🇳🇱 +31 Netherlands'],
    ['+47','🇳🇴 +47 Norway'],
    ['+46','🇸🇪 +46 Sweden'],
    ['+41','🇨🇭 +41 Switzerland'],
    ['+55','🇧🇷 +55 Brazil'],
    ['+52','🇲🇽 +52 Mexico'],
    ['+27','🇿🇦 +27 South Africa'],
    ['+234','🇳🇬 +234 Nigeria'],
    ['+254','🇰🇪 +254 Kenya']
  ];

  function createCountrySelect(id){
    const wrap = document.createElement('div');
    wrap.className = 'form-group';
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = 'Country Code';
    const sel = document.createElement('select');
    sel.id = id;
    sel.name = 'country_code';
    // add options
    countryOptions.forEach(opt => {
      const o = document.createElement('option');
      o.value = opt[0];
      o.textContent = opt[1];
      sel.appendChild(o);
    });
    wrap.appendChild(label);
    wrap.appendChild(sel);
    return wrap;
  }

  function createPhoneInput(id){
    const wrap = document.createElement('div');
    wrap.className = 'form-group';
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = 'Phone';
    const input = document.createElement('input');
    input.type = 'tel';
    input.id = id;
    input.name = 'phone';
    input.placeholder = '1234567890';
    wrap.appendChild(label);
    wrap.appendChild(input);
    return wrap;
  }

  function ensureForForm(form, index){
    if (!form) return;
    // avoid adding duplicate fields: check for any element with name/id country_code or phone
    const hasCountry = form.querySelector('[name="country_code"], #country_code, select[name="country_code"]');
    const hasPhone = form.querySelector('[name="phone"], #phone, input[name="phone"]');

    // Determine safe unique IDs per form (to avoid duplicate IDs when multiple forms exist)
    const cid = hasCountry ? (hasCountry.id || 'country_code') : ('country_code' + (index || '') );
    const pid = hasPhone ? (hasPhone.id || 'phone') : ('phone' + (index || '') );

    // Find a good insertion point:
    // prefer: before existing phone field, else before email field, else at top of form, else append
    const emailEl = form.querySelector('input[type="email"], input[name="email"], #email');
    const phoneEl = form.querySelector('input[type="tel"], input[name="phone"], #phone');
    const referenceNode = phoneEl || emailEl;

    // Insert country select if missing
    if (!hasCountry) {
      const countryNode = createCountrySelect(cid);
      if (referenceNode) {
        form.insertBefore(countryNode, referenceNode);
      } else {
        // try to insert near top but after any heading inside form
        const firstFormChild = Array.from(form.children).find(c => c.tagName.toLowerCase() === 'div' || c.tagName.toLowerCase() === 'fieldset');
        if (firstFormChild) form.insertBefore(countryNode, firstFormChild);
        else form.insertBefore(countryNode, form.firstChild);
      }
    }

    // Insert phone input if missing (and ensure it's placed after country select)
    if (!hasPhone) {
      const phoneNode = createPhoneInput(pid);
      // find country node we may have just added
      const countryNodeNow = form.querySelector(`#${cid}`) ? form.querySelector(`#${cid}`).closest('.form-group') : null;
      if (countryNodeNow && countryNodeNow.nextSibling) {
        form.insertBefore(phoneNode, countryNodeNow.nextSibling);
      } else if (referenceNode) {
        // if referenceNode was phoneEl (unlikely) or emailEl, insert before email
        form.insertBefore(phoneNode, referenceNode);
      } else {
        form.appendChild(phoneNode);
      }
    }
  }

  function run() {
    let idx = 0;
    formSelectors.forEach(sel => {
      const forms = Array.from(document.querySelectorAll(sel));
      forms.forEach(f => {
        ensureForForm(f, ++idx);
      });
    });
    // If no form found by selectors, try to find any <form> with 'quote' or 'contact' in aria-label or class
    if (idx === 0) {
      const fallback = Array.from(document.querySelectorAll('form')).filter(f => {
        const a = (f.getAttribute('aria-label') || '').toLowerCase();
        const c = (f.className || '').toLowerCase();
        return a.includes('quote') || a.includes('contact') || c.includes('contact') || c.includes('quote');
      });
      fallback.forEach(f => ensureForForm(f, ++idx));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
/* ===== MGS Cookie Consent logic (append to end of js/main.js) ===== */
(function initMgsCookieConsent() {
  const KEY = 'mgs_cookie_consent'; // values: 'all' | 'necessary'
  const BAR_ID = 'mgs-cookie-consent';
  const COOKIE_NAME = 'mgs_cookie_consent';

  function setCookie(name, value, days) {
    try {
      const d = new Date();
      d.setTime(d.getTime() + (days*24*60*60*1000));
      document.cookie = `${name}=${encodeURIComponent(value)};path=/;expires=${d.toUTCString()};SameSite=Lax`;
    } catch (e) { /* ignore */ }
  }
  function getLocal() { try { return localStorage.getItem(KEY); } catch(e){ return null; } }
  function setLocal(v) { try { localStorage.setItem(KEY, v); } catch(e){} }

  function showBar() {
    const bar = document.getElementById(BAR_ID);
    if (!bar) return;
    bar.classList.add('mgs-visible');
    bar.setAttribute('aria-hidden', 'false');
    document.body.classList.add('mgs-cookie-visible');
    // ensure sticky button moves up
    // (we also change style safely)
  }

  function hideBar() {
    const bar = document.getElementById(BAR_ID);
    if (!bar) return;
    bar.classList.remove('mgs-visible');
    bar.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('mgs-cookie-visible');
  }

  function applyConsent(mode) {
    // mode: 'all' or 'necessary'
    setLocal(mode);
    setCookie(COOKIE_NAME, mode, 365);
    // hide bar
    hideBar();

    // Hooks: call functions depending on consent. Replace with your analytics/marketing toggles.
    if (mode === 'all') {
      // Enable all optional cookies / analytics
      try { window.dispatchEvent(new CustomEvent('mgs.cookies.accepted', { detail: { mode: 'all' } })); } catch(e){}
      // If you load analytics lazily, you can call your loader here.
      // Example: loadAnalytics();
    } else {
      // Necessary only - disable analytics or avoid loading them
      try { window.dispatchEvent(new CustomEvent('mgs.cookies.necessary', { detail: { mode: 'necessary' } })); } catch(e){}
    }
  }

  // attach buttons
  function bindButtons() {
    const aAll = document.getElementById('mgs-accept-all');
    const aNec = document.getElementById('mgs-accept-necessary');

    if (aAll) aAll.addEventListener('click', function() {
      applyConsent('all');
    });

    if (aNec) aNec.addEventListener('click', function() {
      applyConsent('necessary');
    });

    // allow keyboard enter/space from buttons naturally (native buttons)
  }

  // on init - show only if no stored consent
  function init() {
    const existing = getLocal();
    bindButtons();
    // small delay ensures layout/sticky elements are ready; but show immediately if no consent
    if (!existing) {
      // show the bar after small microtask so it doesn't clash with other DOM mods
      setTimeout(showBar, 60);
    } else {
      // If previously set to 'all', maybe trigger event to allow analytics
      if (existing === 'all') {
        try { window.dispatchEvent(new CustomEvent('mgs.cookies.accepted', { detail: { mode: 'all', restored: true } })); } catch(e){}
      } else {
        try { window.dispatchEvent(new CustomEvent('mgs.cookies.necessary', { detail: { mode: 'necessary', restored: true } })); } catch(e){}
      }
    }

    // accessibility: if someone focuses the element before visible, ensure it's visible
    const bar = document.getElementById(BAR_ID);
    if (bar) {
      bar.addEventListener('keydown', function(ev){
        if (ev.key === 'Escape') {
          // hide if esc and we have a consent already, else do nothing
          const existing2 = getLocal();
          if (existing2) hideBar();
        }
      });
    }
  }

  // Run when DOM ready (safe if main.js already runs on DOMContentLoaded earlier)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* ===== MGS Cookie Bar — inject + bind (single authoritative script) ===== */
(function ensureMgsCookieBar() {
  const KEY = 'mgs_cookie_consent'; // 'all'|'necessary'
  const COOKIE_NAME = 'mgs_cookie_consent';
  const BAR_ID = 'mgs-cookie-consent';

  function setCookie(name, value, days) {
    try {
      const d = new Date();
      d.setTime(d.getTime() + (days*24*60*60*1000));
      document.cookie = `${name}=${encodeURIComponent(value)};path=/;expires=${d.toUTCString()};SameSite=Lax`;
    } catch (e) {}
  }
  function getLocal() { try { return localStorage.getItem(KEY); } catch(e) { return null; } }
  function setLocal(v) { try { localStorage.setItem(KEY, v); } catch(e) {} }

  // HTML snippet for the cookie bar (kept minimal; JS injects into body if missing)
  const html = `
  <div id="${BAR_ID}" class="mgs-cookie-consent" role="dialog" aria-live="polite" aria-hidden="true">
    <div class="mgs-cookie-inner">
      <div class="mgs-cookie-text">
        <strong>We use cookies</strong>
        <p>We use essential cookies to make the site work and optional cookies to improve performance and analytics. Choose "Accept all" to enable optional cookies or "Necessary only" to allow just essential cookies.</p>
      </div>
      <div class="mgs-cookie-actions" role="group" aria-label="Cookie actions">
        <button id="mgs-accept-necessary" class="btn btn-secondary" aria-pressed="false">Necessary only</button>
        <button id="mgs-accept-all" class="btn btn-primary" aria-pressed="false">Accept all cookies</button>
      </div>
    </div>
  </div>`;

  // Insert bar into document body if not present
  function injectIfMissing() {
    if (!document.getElementById(BAR_ID)) {
      try {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        document.body.appendChild(wrapper.firstElementChild);
      } catch (e) { console.error('MGS cookie inject error', e); }
    }
  }

  // Show/hide helpers
  function showBar() {
    const bar = document.getElementById(BAR_ID);
    if (!bar) return;
    bar.classList.add('mgs-visible');
    bar.setAttribute('aria-hidden', 'false');
    document.body.classList.add('mgs-cookie-visible');
    // if mobile panel is open, close it to avoid overlap
    const panel = document.querySelector('.mgs-mobile-panel.open');
    if (panel) panel.classList.remove('open');
    const backdrop = document.querySelector('.mgs-backdrop.open');
    if (backdrop) backdrop.classList.remove('open');
  }
  function hideBar() {
    const bar = document.getElementById(BAR_ID);
    if (!bar) return;
    bar.classList.remove('mgs-visible');
    bar.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('mgs-cookie-visible');
  }

  // Apply consent and dispatch events for analytics loaders to pick up
  function applyConsent(mode) {
    setLocal(mode);
    setCookie(COOKIE_NAME, mode, 365);
    hideBar();
    try {
      if (mode === 'all') {
        window.dispatchEvent(new CustomEvent('mgs.cookies.accepted', { detail: { mode: 'all' } }));
      } else {
        window.dispatchEvent(new CustomEvent('mgs.cookies.necessary', { detail: { mode: 'necessary' } }));
      }
      window.dispatchEvent(new CustomEvent('mgs.cookies.changed', { detail: { mode } }));
    } catch (e) { /* ignore */ }
  }

  // Bind buttons (idempotent)
  function bindButtons() {
    const btnAll = document.getElementById('mgs-accept-all');
    const btnNec = document.getElementById('mgs-accept-necessary');
    if (btnAll && !btnAll._mgsBound) {
      btnAll.addEventListener('click', function(e) { e.preventDefault(); applyConsent('all'); });
      btnAll._mgsBound = true;
    }
    if (btnNec && !btnNec._mgsBound) {
      btnNec.addEventListener('click', function(e) { e.preventDefault(); applyConsent('necessary'); });
      btnNec._mgsBound = true;
    }
  }

  // Initialization
  function initOnce() {
    injectIfMissing();
    bindButtons();
    const existing = getLocal();
    if (!existing) {
      // show after a small delay so other scripts settle
      setTimeout(showBar, 60);
    } else {
      // trigger events if required
      if (existing === 'all') {
        try { window.dispatchEvent(new CustomEvent('mgs.cookies.accepted', { detail: { mode: 'all', restored: true } })); } catch(e){}
      } else {
        try { window.dispatchEvent(new CustomEvent('mgs.cookies.necessary', { detail: { mode: 'necessary', restored: true } })); } catch(e){}
      }
    }

    // Defensive: re-bind if DOM mutates and cookie element inserted later
    if (window.MutationObserver) {
      const obs = new MutationObserver(() => { bindButtons(); });
      obs.observe(document.body, { childList: true, subtree: true });
      // one-shot cleanup after a short while to avoid forever-observing (safe)
      setTimeout(() => obs.disconnect(), 60_000);
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOnce);
  } else {
    initOnce();
  }

})();
/* ===== MGS Cookie Buttons: robust click binding (delegation) ===== */
(function mgsCookieClickDelegation() {
  if (window._mgs_cookie_click_listener_installed) return;
  window._mgs_cookie_click_listener_installed = true;

  const KEY = 'mgs_cookie_consent';
  const COOKIE_NAME = 'mgs_cookie_consent';
  const BAR_ID = 'mgs-cookie-consent';

  function setCookie(name, value, days) {
    try {
      const d = new Date();
      d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
      document.cookie = `${name}=${encodeURIComponent(value)};path=/;expires=${d.toUTCString()};SameSite=Lax`;
    } catch (e) { /* ignore */ }
  }
  function setLocal(v) { try { localStorage.setItem(KEY, v); } catch(e){} }

  function hideBar() {
    const bar = document.getElementById(BAR_ID);
    if (!bar) return;
    bar.classList.remove('mgs-visible');
    bar.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('mgs-cookie-visible');
  }

  // Delegated click handler — works even if buttons are inserted later
  document.addEventListener('click', function (ev) {
    const btn = ev.target.closest && ev.target.closest('#mgs-accept-all, #mgs-accept-necessary');
    if (!btn) return;
    ev.preventDefault();

    if (btn.id === 'mgs-accept-all') {
      // Accept all
      setLocal('all');
      setCookie(COOKIE_NAME, 'all', 365);
      hideBar();
      try { window.dispatchEvent(new CustomEvent('mgs.cookies.accepted', { detail: { mode: 'all' } })); } catch(e){}
      try { window.dispatchEvent(new CustomEvent('mgs.cookies.changed', { detail: { mode: 'all' } })); } catch(e){}
      console.info('[mgs] Cookie: accepted all');
    } else if (btn.id === 'mgs-accept-necessary') {
      // Necessary only
      setLocal('necessary');
      setCookie(COOKIE_NAME, 'necessary', 365);
      hideBar();
      try { window.dispatchEvent(new CustomEvent('mgs.cookies.necessary', { detail: { mode: 'necessary' } })); } catch(e){}
      try { window.dispatchEvent(new CustomEvent('mgs.cookies.changed', { detail: { mode: 'necessary' } })); } catch(e){}
      console.info('[mgs] Cookie: necessary only');
    }
  }, { passive: false });
})();
/* ===== MGS: force-remove cookie bar on consent + ensure persistence check on load ===== */
(function mgsCookieEnsureRemoval() {
  if (window._mgs_cookie_ensure_installed) return;
  window._mgs_cookie_ensure_installed = true;

  const KEY = 'mgs_cookie_consent';
  const COOKIE_NAME = 'mgs_cookie_consent';
  const BAR_ID = 'mgs-cookie-consent';

  function getCookieVal(name) {
    try {
      const kv = document.cookie.split('; ').find(c => c && c.indexOf(name + '=') === 0);
      return kv ? decodeURIComponent(kv.split('=')[1]) : null;
    } catch (e) { return null; }
  }

  function removeBarFromDOM() {
    try {
      const el = document.getElementById(BAR_ID);
      if (!el) return;
      // remove gracefully so no CSS reflow issues
      el.style.transition = 'none';
      el.classList.remove('mgs-visible');
      // small timeout to allow any UI updates then remove
      setTimeout(() => {
        if (el && el.parentNode) el.parentNode.removeChild(el);
      }, 80);
    } catch (e) {
      // defensive fallback
      try { const el = document.getElementById(BAR_ID); el && el.remove(); } catch(_) {}
    }
  }

  // When consent is applied via clicks elsewhere in page (existing handlers dispatch events),
  // listen for our custom events too and remove the bar immediately.
  window.addEventListener('mgs.cookies.accepted', function () { removeBarFromDOM(); }, { passive: true });
  window.addEventListener('mgs.cookies.necessary', function () { removeBarFromDOM(); }, { passive: true });
  window.addEventListener('mgs.cookies.changed', function () { removeBarFromDOM(); }, { passive: true });

  // Also delegate clicks just in case (this duplicates earlier logic but is harmless):
  document.addEventListener('click', function (e) {
    const btn = e.target.closest && e.target.closest('#mgs-accept-all, #mgs-accept-necessary');
    if (!btn) return;
    // allow existing handlers to run first then remove DOM
    setTimeout(removeBarFromDOM, 20);
  }, { passive: true });

  // On every page load, check both localStorage and cookie and remove the bar if consent exists.
  function initCheck() {
    let stored = null;
    try { stored = localStorage.getItem(KEY); } catch(e) { stored = null; }
    const cookieVal = getCookieVal(COOKIE_NAME);

    if (stored === 'all' || stored === 'necessary' || cookieVal === 'all' || cookieVal === 'necessary') {
      // remove any visible cookie UI immediately
      removeBarFromDOM();
    } else {
      // If no consent exists, nothing to remove — the normal bar flow will show it.
    }
  }

  // Run check after DOM is ready (fast)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCheck);
  } else {
    initCheck();
  }
})();
/* ===== MGS: Lazy-load GA4 only after user consents ===== */
(function mgsLazyLoadGA4() {
  if (window._mgs_ga4_loader_installed) return;
  window._mgs_ga4_loader_installed = true;

  const GA_ID = 'G-13116769650'; // Your real GA4 ID

  function loadGA4() {
    if (window._mgs_ga4_loaded) return;
    window._mgs_ga4_loaded = true;
    console.info('[mgs] Loading GA4:', GA_ID);

    // 1) Load GA4 script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(script);

    // 2) Configure gtag
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', GA_ID, { send_page_view: true });

    console.info('[mgs] GA4 script appended and configured.');
  }

  // Load GA only after "Accept all cookies"
  window.addEventListener('mgs.cookies.accepted', function (e) {
    try {
      if (e && e.detail && e.detail.mode === 'all') {
        loadGA4();
      }
    } catch (err) {
      console.error('[mgs] GA4 consent handler error', err);
    }
  });

  // If user already accepted earlier, auto-load GA
  try {
    if (localStorage.getItem('mgs_cookie_consent') === 'all') {
      setTimeout(loadGA4, 80);
    }
  } catch (err) { /* ignore */ }

  // Optional: manual debug function
  window.mgsLoadGA4 = loadGA4;
})();
