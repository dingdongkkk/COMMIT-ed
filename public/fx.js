/* Motion layer: scroll reveals, letter splitting, count-ups, thwip clicks,
   cursor reticle, card tilt. Everything degrades to a static page if it fails. */

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- scroll reveal ---------- */

const revealables = document.querySelectorAll(
  '.card, .panel, .page-head, .board, .review, .empty, .hero-card, .admin-stats, .sec',
);

if (reduced || !('IntersectionObserver' in window)) {
  revealables.forEach((el) => el.classList.add('in-view'));
} else {
  // Anything already on screen at load is shown at once — a reveal you have to
  // wait through before you can read the page is just a slow page.
  const below = [];
  revealables.forEach((el) => {
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    el.classList.add('reveal');
    below.push(el);
  });
  below.forEach((el, i) => {
    // Stagger within a group, but never delay so long it feels broken.
    el.style.setProperty('--delay', `${Math.min(i, 4) * 0.06}s`);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  below.forEach((el) => observer.observe(el));
}

/* ---------- header: shrink + scroll progress bar ---------- */

const head = document.querySelector('.site-head');
let ticking = false;

function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const max = document.body.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    head.style.setProperty('--scroll', `${pct}%`);
    head.classList.toggle('stuck', window.scrollY > 30);
    ticking = false;
  });
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- hero title: split into animated letters ---------- */

for (const line of document.querySelectorAll('.hero h1 [data-split]')) {
  const words = line.textContent.split(/\s+/).filter(Boolean);
  line.textContent = '';
  let i = 0;
  words.forEach((word, w) => {
    // Letters live inside a word wrapper so a line break never splits a word.
    const holder = document.createElement('span');
    holder.className = 'wd';
    for (const char of word) {
      const span = document.createElement('span');
      span.className = 'ltr';
      span.textContent = char;
      span.style.setProperty('--d', `${0.25 + i * 0.045}s`);
      holder.append(span);
      i += 1;
    }
    line.append(holder);
    if (w < words.length - 1) line.append(' ');
  });
}

/* ---------- stat count-up ---------- */

function countUp(el) {
  const target = Number(el.dataset.count);
  if (!Number.isFinite(target) || target === 0) return;
  const duration = 1100;
  const start = performance.now();
  function step(now) {
    const t = Math.min((now - start) / duration, 1);
    // easeOutCubic, so the number lands softly instead of stopping dead.
    el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const counters = document.querySelectorAll('[data-count]');
if (reduced || !('IntersectionObserver' in window)) {
  counters.forEach((el) => {
    el.textContent = el.dataset.count;
  });
} else {
  const counterObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        countUp(entry.target);
        counterObserver.unobserve(entry.target);
      }
    },
    { threshold: 0.5 },
  );
  counters.forEach((el) => {
    el.textContent = '0';
    counterObserver.observe(el);
  });
}

/* ---------- thwip: a web line shoots to whatever you click ---------- */

if (!reduced && finePointer) {
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.btn, .cta, .card, .sw')) return;
    const line = document.createElement('span');
    line.className = 'thwip';
    // Fired from the top-right corner, like a web zip-line.
    const originX = window.innerWidth - 20;
    const originY = 10;
    const dx = event.clientX - originX;
    const dy = event.clientY - originY;
    const dist = Math.hypot(dx, dy);
    line.style.left = `${originX}px`;
    line.style.top = `${originY}px`;
    line.style.height = `${dist}px`;
    line.style.transform = `rotate(${Math.atan2(dy, dx) - Math.PI / 2}rad)`;
    line.style.transition = 'opacity 0.42s ease-out';
    document.body.append(line);
    requestAnimationFrame(() => {
      line.style.opacity = '0';
    });
    setTimeout(() => line.remove(), 460);
  });
}

/* ---------- cursor reticle ---------- */

if (!reduced && finePointer) {
  const reticle = document.createElement('div');
  reticle.className = 'reticle';
  document.body.append(reticle);

  let x = 0;
  let y = 0;
  let rx = 0;
  let ry = 0;

  document.addEventListener('mousemove', (event) => {
    x = event.clientX;
    y = event.clientY;
    reticle.classList.add('on');
    reticle.classList.toggle(
      'hot',
      Boolean(event.target.closest('a, button, input, select, .card, .review')),
    );
  });
  document.addEventListener('mouseleave', () => reticle.classList.remove('on'));

  (function follow() {
    // Trails slightly behind the real cursor — reads as a spider-sense sweep.
    rx += (x - rx) * 0.22;
    ry += (y - ry) * 0.22;
    reticle.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(follow);
  })();
}

/* ---------- pointer tilt on the terminal card and badge preview ---------- */

if (!reduced && finePointer) {
  for (const el of document.querySelectorAll('[data-tilt]')) {
    const strength = Number(el.dataset.tilt) || 8;
    el.addEventListener('mousemove', (event) => {
      const rect = el.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(900px) rotateY(${px * strength}deg) rotateX(${
        -py * strength
      }deg) translateY(-6px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  }
}
