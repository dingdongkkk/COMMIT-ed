/* GitHub Account Verification for Submit PR Page */
(function () {
  'use strict';

  // Hardcoded dummy array of valid GitHub IDs (lowercased)
  const VALID_GITHUB_IDS = [
    'octocat',
    'ada',
    'torvalds',
    'gaearon',
    'kadenstack',
    'sindresorhus',
    'danabramov',
    'yyx990803',
    'tj',
    'defunkt',
    'mojombo',
    'pjhyett',
    'wycats',
    'ezmobius',
    'techlead',
    'dhh',
    'ry',
    'antirez',
    'vczh',
    'sw-yx',
    'addyosmani',
    'paulirish',
  ];

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

    function verify() {
      const raw = input.value;
      const clean = normalize(raw);

      if (!clean) {
        statusEl.innerHTML = '';
        statusEl.className = 'github-id-status';
        if (wrapEl) wrapEl.classList.remove('is-valid', 'is-invalid');
        return;
      }

      const isValid = VALID_GITHUB_IDS.includes(clean);

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

    input.addEventListener('input', verify);
    input.addEventListener('keyup', verify);
    input.addEventListener('change', verify);
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
