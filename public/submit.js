/* GitHub Account Verification for Submit PR Page */
(function () {
  'use strict';

  /**
   * No list here on purpose. The roster lives on the server; this asks it.
   * A second copy in the browser drifted out of date — real participants saw
   * "Unverified" while demo names got a tick — and it published every handle
   * in the page source.
   */
  let lastQuery = 0;

  async function isRegistered(username) {
    const stamp = ++lastQuery;
    const res = await fetch('/verify-username?u=' + encodeURIComponent(username));
    if (!res.ok) throw new Error('lookup failed');
    const data = await res.json();
    // A slower earlier request must not overwrite a newer answer.
    if (stamp !== lastQuery) return null;
    return Boolean(data.valid);
  }


  function normalize(username) {
    return String(username || '')
      .trim()
      .replace(/^@/, '')
      .toLowerCase();
  }

  function initVerification() {
    const input = document.querySelector('input[name="github_username"]');
    const statusEl = document.getElementById('github-id-status');
    const wrapEl = input ? input.closest('.github-id-wrap') : null;

    if (!input || !statusEl) return;

    async function verify() {
      const raw = input.value;
      const clean = normalize(raw);

      if (!clean) {
        statusEl.innerHTML = '';
        statusEl.className = 'github-id-status';
        if (wrapEl) wrapEl.classList.remove('is-valid', 'is-invalid');
        return;
      }

      let isValid;
      try {
        isValid = await isRegistered(clean);
      } catch {
        // Network trouble is not the contributor's problem: say nothing and
        // let the server decide when they submit.
        statusEl.innerHTML = '';
        statusEl.className = 'github-id-status';
        if (wrapEl) wrapEl.classList.remove('is-valid', 'is-invalid');
        return;
      }
      if (isValid === null) return;

      if (isValid) {
        statusEl.className = 'github-id-status valid';
        statusEl.innerHTML = `
          <span class="badge-check-icon" title="Verified GitHub ID">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </span>
          <span class="badge-check-text">Verified Account</span>
        `;
        if (wrapEl) {
          wrapEl.classList.add('is-valid');
          wrapEl.classList.remove('is-invalid');
        }
      } else {
        statusEl.className = 'github-id-status invalid';
        statusEl.innerHTML = `
          <span class="badge-check-icon" title="Unverified GitHub ID">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </span>
          <span class="badge-check-text">ID Not Recognized</span>
        `;
        if (wrapEl) {
          wrapEl.classList.add('is-invalid');
          wrapEl.classList.remove('is-valid');
        }
      }
    }

    // Every keystroke used to be a comparison against a local array; each one
    // is now a request, so wait for a pause in typing.
    let timer;
    const scheduleVerify = () => {
      clearTimeout(timer);
      timer = setTimeout(verify, 250);
    };

    input.addEventListener('input', scheduleVerify);
    input.addEventListener('change', scheduleVerify);
    input.addEventListener('blur', verify);

    // Initial check on load
    verify();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVerification);
  } else {
    initVerification();
  }
})();
