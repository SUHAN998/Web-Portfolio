/* PROFILE 01-1/01-2. INTRO Three.js renderer remains unchanged. */
(() => {
  'use strict';
  const profile = document.getElementById('profile');
  const begin = document.getElementById('star-hit');
  const toggle = document.getElementById('profile-toggle');
  const reason = document.getElementById('reason-text');
  const more = document.getElementById('profile-more');
  const identity = profile?.querySelector('.profile-identity');
  if (!profile || !begin || !toggle || !reason || !more || !identity) return;

  let resizeTimer = null;

  function measure() {
    const inner = reason.querySelector('.reason-inner');
    if (inner) {
      // offsetWidth is in unscaled stage CSS pixels; Range rectangles are viewport-scaled.
      // The animated end width must equal the final width exactly (no post-animation snap).
      const exact = Math.ceil(inner.offsetWidth || inner.scrollWidth || 0);
      if (exact > 0 && !profile.classList.contains('is-visible')) {
        reason.style.setProperty('--reason-exact-width', exact + 'px');
      }
    }
    const body = more.querySelector('.profile-more-inner');
    if (body) {
      const exact = Math.ceil(body.scrollHeight || body.getBoundingClientRect().height || 0);
      if (exact > 0) more.style.setProperty('--detail-exact-height', exact + 'px');
    }
    // Left large Korean name, right two-line stack: shared height and exact portrait width.
    const title = identity.querySelector('strong');
    const english = identity.querySelector('.profile-identity-right span');
    const mbti = identity.querySelector('.profile-identity-right small');
    if (!title || !english || !mbti) return;
    const fullWidth = identity.clientWidth;
    if (!fullWidth) return;
    // Measure REAL glyph bounds (including variable-font metrics and letter spacing).
    // Canvas estimates used in v1.22 could undershoot the actual width and font size.
    const gap = 5;
    const glyphWidth = el => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return range.getBoundingClientRect().width;
    };
    const scaleOnStage = identity.getBoundingClientRect().width / fullWidth || 1;
    function fitAt(scale) {
      const typeFactor = Number(getComputedStyle(document.documentElement).getPropertyValue('--orbit-type-adjust')) || 1;
      title.style.fontSize = (59 * scale * typeFactor).toFixed(3) + 'px';
      english.style.fontSize = (30 * scale * typeFactor).toFixed(3) + 'px';
      mbti.style.fontSize = (26 * scale * typeFactor).toFixed(3) + 'px';
      return (glyphWidth(title) + Math.max(glyphWidth(english), glyphWidth(mbti))) / scaleOnStage + gap;
    }
    let lo = .55, hi = 1.65;
    for (let j = 0; j < 22; j++) {
      const mid = (lo + hi) / 2;
      if (fitAt(mid) <= fullWidth - 2) lo = mid;
      else hi = mid;
    }
    // v1.50.30: preserve the approved Korean name size and the fitted width.
    // Each right-hand label is 90% of its v1.50.29 rendered size (.8 * .9).
    fitAt(lo);
    english.style.fontSize = (30 * lo * 0.72 * (Number(getComputedStyle(document.documentElement).getPropertyValue('--orbit-type-adjust')) || 1)).toFixed(3) + 'px';
    mbti.style.fontSize = (26 * lo * 0.72 * (Number(getComputedStyle(document.documentElement).getPropertyValue('--orbit-type-adjust')) || 1)).toFixed(3) + 'px';
  }
  reason.addEventListener('animationend', event => {
    if (event.animationName === 'reasonOpen') {
      reason.classList.add('reason-complete');
      profile.classList.add('is-reason-done');
    }
  });
  function enter() {
    if (!profile.hidden) return;
    reason.classList.remove('reason-complete');
    profile.classList.remove('is-reason-done');
    profile.hidden = false;
    // Always measure after the element is in layout and fonts have loaded.
    requestAnimationFrame(() => {
      measure();
      requestAnimationFrame(() => profile.classList.add('is-visible'));
    });
    document.fonts?.ready?.then(() => {
      if (!profile.hidden) measure();
    });
  }
  // Enter only after the opening logo has travelled ~85% to the header.
  // The event comes from the existing GSAP intro timeline, so timing cannot
  // drift relative to the logo's position.
  window.addEventListener('orbit:intro-logo-near-docked', enter);
  toggle.addEventListener('click', () => {
    measure();
    const expanded = profile.classList.toggle('is-expanded');
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.querySelector('.toggle-label').textContent = expanded ? 'Close Detail' : 'Show Detail';
  });
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (!profile.hidden) measure(); }, 60);
  });
  window.addEventListener('keydown', e => {
    if (!new URLSearchParams(location.search).has('debug') || e.key.toLowerCase() !== 'r') return;
    profile.classList.remove('is-expanded', 'is-visible', 'is-reason-done');
    reason.classList.remove('reason-complete');
    profile.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.querySelector('.toggle-label').textContent = 'Show Detail';
  });
  if (new URLSearchParams(location.search).get('jump') === 'docked') enter();
})();
