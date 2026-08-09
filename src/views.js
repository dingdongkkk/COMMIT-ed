import { readLabels } from './db.js';

export function escape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Cache key for the CSS and JS. It has to change per *deployment*, not per
 * process: serverless starts a fresh process constantly, and a per-boot value
 * makes every visitor re-download the stylesheet they already have. Vercel
 * exposes the commit; everything else falls back to boot time.
 */
const V = (
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.COMMIT_SHA ||
  Date.now().toString(36)
).slice(0, 12);

const NAV = [
  ['/get-started', 'Get Started'],
  ['/projects', 'Projects'],
  ['/submit', 'Submit PR'],
  ['/leaderboard', 'Leaderboard'],
  ['/rules', 'Rules']
];

const projectsData = {
  beginner: [
    { name: "dhairyagothi/100_days_100_web_project", link: "https://github.com/dhairyagothi/100_days_100_web_project", stack: "HTML / CSS / JavaScript" },
    { name: "MRIARC-08/VidyaSetu", link: "https://github.com/MRIARC-08/VidyaSetu", stack: "React / Next.js / AI" },
    { name: "Venkat-Kolasani/FutureStack", link: "https://github.com/Venkat-Kolasani/FutureStack", stack: "React / JavaScript" },
    { name: "12fahed/CertiNova", link: "https://github.com/12fahed/CertiNova", stack: "TypeScript" },
    { name: "Mayur-Pagote/README_Design_Kit", link: "https://github.com/Mayur-Pagote/README_Design_Kit", stack: "Developer Documentation / Tooling" },
    { name: "darshan2456/C_DSA_interactive_suite", link: "https://github.com/darshan2456/C_DSA_interactive_suite", stack: "C / DSA" },
    { name: "PRODHOSH/gssoc-tracker", link: "https://github.com/PRODHOSH/gssoc-tracker", stack: "Next.js / TypeScript" }
  ],
  intermediate: [
    { name: "Ruthwik000/tokenfirewall", link: "https://github.com/Ruthwik000/tokenfirewall", stack: "TypeScript / LLM Infrastructure" },
    { name: "im-anishraj/arnio", link: "https://github.com/im-anishraj/arnio", stack: "Python / Data Science / C++" },
    { name: "riteshbonthalakoti/HELPDESK.AI", link: "https://github.com/riteshbonthalakoti/HELPDESK.AI", stack: "FastAPI / React / AI" },
    { name: "kalyan-1845/ai-code-reviewer", link: "https://github.com/kalyan-1845/ai-code-reviewer", stack: "AI / Security / Web" },
    { name: "itzzavdhesh/VoiceForge", link: "https://github.com/itzzavdhesh/VoiceForge", stack: "AI / Accessibility" },
    { name: "SamXop123/samdev-pulse", link: "https://github.com/SamXop123/samdev-pulse", stack: "JavaScript / GitHub API" },
    { name: "Shivayan09/Vector-social-media", link: "https://github.com/Shivayan09/Vector-social-media", stack: "Next.js / Node.js / MongoDB" },
    { name: "ManabBiswas/EkagraFocus", link: "https://github.com/ManabBiswas/EkagraFocus", stack: "Electron / React / TypeScript" },
    { name: "Abhigyan-Shekhar/Waggle-mcp", link: "https://github.com/Abhigyan-Shekhar/Waggle-mcp", stack: "Python 3.11+, SQLite, Neo4j, MCP, React, Vite" }
  ],
  advanced: [
    { name: "RatLoopz/sahidawa-india", link: "https://github.com/RatLoopz/sahidawa-india", stack: "Next.js / TypeScript / Security / Testing" },
    { name: "NEXARA-oss/PulseStack", link: "https://github.com/NEXARA-oss/PulseStack", stack: "AI Infrastructure / Observability" },
    { name: "OWASP-BLT/BLT", link: "https://github.com/OWASP/www-project-bug-logging-tool", stack: "Python / Cybersecurity" }
  ]
};

export function layout({ title, active, body, head = '', scripts = '' }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)} · COMMIT-ed</title>
<link rel="stylesheet" href="/app.css?v=${V}">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🕸️</text></svg>">
${head}
</head>
<body>
<header class="site-head" style="position: relative;">
  <!-- Far Left Logo -->
  <img src="/protocol1.png" alt="Protocol Logo" class="nav-logo logo-left"
       width="3654" height="1838">

  <a class="brand" href="/">COMMIT<span>-ed</span>.</a>
  <nav>
    ${NAV.map(
      ([href, label]) =>
        `<a href="${href}"${active === href ? ' class="active"' : ''}>${label}</a>`,
    ).join('\n    ')}
  </nav>
  <a class="cta" href="/badge">Get your badge</a>

  <!-- Far Right Logo -->
  <img src="/ieee1.png" alt="IEEE Logo" class="nav-logo logo-right"
       width="816" height="334">
</header>
<main>
${body}
</main>
<footer class="site-foot">
  <span>COMMIT-ed · build in public with your campus community</span>
  <a href="https://protocolbmsce.in/core" target="_blank" rel="noopener noreferrer">About us</a>
</footer>
<script src="/fx.js?v=${V}" defer></script>
${scripts}
</body>
</html>`;
}

/** Hand-drawn corner web, stroke-animated by CSS on load. */
const CORNER_WEB = `<svg class="corner-web" viewBox="0 0 200 200" aria-hidden="true">
  <g style="--len:420">
    <path d="M0 0 L200 60"/><path d="M0 0 L170 120"/><path d="M0 0 L120 170"/>
    <path d="M0 0 L60 200"/><path d="M0 0 L200 0"/><path d="M0 0 L0 200"/>
  </g>
  <g style="--len:300">
    <path d="M46 0 Q40 40 0 46"/>
    <path d="M88 0 Q78 78 0 88"/>
    <path d="M132 0 Q118 118 0 132"/>
    <path d="M180 0 Q160 160 0 180"/>
  </g>
</svg>`;


/**
 * Comic-ink skyline for the landing page: solid black towers with lit windows.
 * Built once at boot from a fixed table so every render is identical.
 */
function buildSkyline() {
  const W = 1440;
  const H = 420;
  const towers = [
    [-20, 130, 392], [104, 92, 300], [186, 74, 232], [248, 112, 336], [350, 84, 204],
    [420, 104, 272], [512, 72, 168], [572, 122, 306], [682, 92, 222], [760, 74, 150],
    [820, 112, 262], [922, 84, 192], [988, 104, 324], [1080, 72, 212], [1138, 124, 366],
    [1248, 92, 250], [1326, 134, 404],
  ];

  let out = '';
  let win = 0;

  towers.forEach(([x, w, h], i) => {
    const y = H - h;
    out += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2"/>`;

    // Water tower or antenna on the taller blocks, for a city silhouette.
    if (h > 300) {
      const cx = x + w / 2;
      out += `<rect x="${cx - 2}" y="${y - 34}" width="4" height="34"/>`;
      out += `<circle cx="${cx}" cy="${y - 40}" r="5"/>`;
    }

    for (let col = x + 15; col < x + w - 18; col += 27) {
      for (let row = y + 26; row < H - 20; row += 32) {
        // Deterministic scatter: same windows dark on every render.
        const n = ((col * 73856093) ^ (row * 19349663)) >>> 0;
        if (n % 5 === 0) continue;
        const lit = n % 7 === 0 ? 'var(--yellow)' : 'var(--pink-pale)';
        const delay = (0.6 + ((win % 24) * 0.045)).toFixed(2);
        out += `<rect class="win" x="${col}" y="${row}" width="12" height="17" fill="${lit}"
          style="--wd:${delay}s"/>`;
        win += 1;
      }
    }
  });

  return `<div class="skyline" aria-hidden="true">
  <svg viewBox="0 0 ${W} ${H}" fill="var(--ink)">${out}</svg>
</div>`;
}

const SKYLINE = buildSkyline();

/** Three yellow speed strokes, poster style. */
const SPEED_LINES = `<svg class="speed-lines" viewBox="0 0 120 60" aria-hidden="true">
  <path d="M14 54 L30 8"/>
  <path d="M46 52 L58 6"/>
  <path d="M78 50 L86 6"/>
</svg>`;

/** Web splat where the strand meets the card it is holding up. */
const WEB_ANCHOR = `<svg class="anchor" viewBox="0 0 80 40" aria-hidden="true">
  <g fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round">
    <path d="M40 2 L8 32M40 2 L20 36M40 2 L40 38M40 2 L60 36M40 2 L72 32"/>
    <path d="M28 14 Q40 20 52 14M20 22 Q40 31 60 22M13 29 Q40 41 67 29"/>
  </g>
</svg>`;

/** Original spider glyph — body, head and eight legs. */
const SPIDER = `<svg class="spider" viewBox="0 0 32 32" aria-hidden="true">
  <g stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round">
    <path d="M13 12 L4 6M13 15 L2 14M13 18 L3 22M14 21 L7 28"/>
    <path d="M19 12 L28 6M19 15 L30 14M19 18 L29 22M18 21 L25 28"/>
  </g>
  <ellipse cx="16" cy="18" rx="6" ry="7.5" fill="currentColor"/>
  <circle cx="16" cy="10" r="4" fill="currentColor"/>
</svg>`;

function flash(message, kind = 'ok') {
  if (!message) return '';
  return `<p class="flash ${kind}">${escape(message)}</p>`;
}

export function homePage({ stats }) {
  return layout({
    title: 'Open Source Season',
    active: '/',
    body: `
<section class="hero">
  ${SKYLINE}
  ${CORNER_WEB}
  <div class="hero-copy">
    ${SPEED_LINES}
    <h1><span class="script">COMMIT-ed</span><br>
        <span class="outline" data-split>Open Source Season</span></h1>
    <p>Build in public with your campus community. Grab a contributor badge, ship a pull
       request, and watch the leaderboard move.</p>
    <div class="hero-actions">
      <a class="btn primary" href="/badge">Generate my badge</a>
      <a class="btn ghost" href="/submit">Submit a pull request</a>
    </div>
  </div>
  <div class="hero-card hang">
    <span class="hang-line">${SPIDER}</span>
    <span class="hang-anchor">${WEB_ANCHOR}</span>
    <div class="term">
      <div class="term-bar"><i></i><i></i><i></i><span>season.ts</span></div>
      <pre><code><span class="k">const</span> season = openSource.<span class="f">start</span>({
  window: <span class="s">'4 weeks'</span>,
  level:  <span class="s">'anyone'</span>,
  review: <span class="s">'by a human'</span>,
  motto:  <span class="s">'with great commits…'</span>,
});

season.<span class="f">on</span>(<span class="s">'pull_request'</span>, () =&gt; <span class="f">thwip</span>());</code></pre>
      <div class="term-foot"><span class="pass">spider-sense: tingling</span><span>leaderboard synced</span></div>
    </div>
  </div>
</section>

<section class="cards">
  <article class="card">
    <span class="tag">Suit up</span>
    <h2>Get your badge</h2>
    <p>Enter your name and GitHub handle. We render a contributor card you can download and
       post anywhere.</p>
    <a href="/badge">Make my badge →</a>
  </article>
  <article class="card">
    <span class="tag">Thwip</span>
    <h2>Submit your PR</h2>
    <p>Paste the link to your pull request. It lands in the review queue as pending.</p>
    <a href="/submit">Submit a link →</a>
  </article>
  <article class="card">
    <span class="tag">Spider-sense</span>
    <h2>Reviewed by a human</h2>
    <p>An organiser opens your PR, reads the diff, and types in the points it earned. No bots,
       no auto-scoring.</p>
    <a href="/leaderboard">See the scoring →</a>
  </article>
  <article class="card">
    <span class="tag">Swing higher</span>
    <h2>Climb the leaderboard</h2>
    <p>Approved points stack up. Ties break in favour of whoever got there first.</p>
    <a href="/leaderboard">View leaderboard →</a>
  </article>
  <article class="card">
    <span class="tag">The Law</span>
    <h2>Rules & Guidelines</h2>
    <p>Read the official event rules, contribution guidelines, and understand the real open-source workflow we follow.</p>
    <a href="/rules">Read the rules →</a>
  </article>
</section>`,
  });
}

/**
 * Two steps: prove the handle is on the registered list, then build the badge.
 * The list lives on the server and is never shipped to the browser, so the
 * roster of participants is not published by the badge page.
 */
export function badgePage({ step = 'verify', username = '', error = '' } = {}) {
  if (step !== 'build') {
    return layout({
      title: 'Contributor badge',
      active: '/badge',
      body: `
<section class="page-head">
  <p class="eyebrow">Contributor badge</p>
  <h1>Get your badge</h1>
  <p>Badges are for registered contributors. Enter the GitHub username you signed up with
     and we'll check it against the list.</p>
</section>

<section class="narrow">
  ${flash(error, 'error')}
  <form class="panel" method="post" action="/badge" autocomplete="off">
    <label>
      GitHub username
      <input name="username" maxlength="39" required autofocus
             value="${escape(username)}" placeholder="ada" pattern="[A-Za-z0-9-]{1,39}">
    </label>
    <button class="btn primary" type="submit">Verify and continue</button>
    <p class="hint">Not recognised? Ask an organiser to add your handle to the season list.</p>
  </form>
</section>`,
    });
  }

  return layout({
    title: 'Contributor badge',
    active: '/badge',
    body: `
<section class="page-head">
  <p class="eyebrow">Verified · @${escape(username)}</p>
  <h1>Get your badge</h1>
  <p>Pick your name and suit, preview the badge and download it as an image you can post
     anywhere.</p>
</section>

<section class="badge-layout">
  <form class="panel" id="badge-form" autocomplete="off">
    <label>
      Full name
      <input id="f-name" name="name" maxlength="60" placeholder="Ada Lovelace" required>
    </label>
    <label>
      GitHub username <span class="opt">(verified)</span>
      <input id="f-username" name="username" value="${escape(username)}" readonly>
    </label>
    <label>
      Role on the badge
      <select id="f-role">
        <option value="Contributor">Contributor</option>
        <option value="Maintainer">Maintainer</option>
        <option value="Mentor">Mentor</option>
        <option value="Campus Lead">Campus Lead</option>
      </select>
    </label>
    <label>
      Suit theme
      <span class="swatches" id="f-theme">
        <button type="button" class="sw selected" title="Spider-Gwen" data-image="/badges/gwen.png"
                data-accent="#ff4fa3" data-secondary="#37e6e6"
                data-bg1="#241344" data-bg2="#0d0620"
                style="--sw:#ff4fa3; --sw2:#37e6e6"><span>Gwen</span></button>
        <button type="button" class="sw" title="Miles Morales" data-image="/badges/miles.png"
                data-accent="#ff2b4d" data-secondary="#a855f7"
                data-bg1="#16101f" data-bg2="#07060c"
                style="--sw:#ff2b4d; --sw2:#a855f7"><span>Miles</span></button>
        <button type="button" class="sw" title="Pavitr Prabhakar" data-image="/badges/pavitr.png"
                data-accent="#ffb020" data-secondary="#29c4c4"
                data-bg1="#23163d" data-bg2="#0e0820"
                style="--sw:#ffb020; --sw2:#29c4c4"><span>Pavitr</span></button>
        <button type="button" class="sw" title="Peter Parker" data-image="/badges/peter.png"
                data-accent="#e01b24" data-secondary="#3d5ce0"
                data-bg1="#141a3d" data-bg2="#07091a"
                style="--sw:#e01b24; --sw2:#3d5ce0"><span>Peter</span></button>
      </span>
    </label>
    <p class="hint" id="badge-hint">The avatar comes straight from your GitHub profile
       picture.</p>
    <div class="row">
      <button type="button" class="btn primary" id="btn-download">Download PNG</button>
      <a class="btn ghost" href="/submit">Next: submit a PR</a>
    </div>
    <p class="hint"><a href="/badge">Use a different handle</a></p>
  </form>

  <div class="badge-preview">
    <canvas id="badge-canvas" width="1000" height="600" data-tilt="10"
            aria-label="Badge preview"></canvas>
  </div>
</section>`,
    scripts: `<script src="/badge.js?v=${V}" defer></script>`,
  });
}

export function submitPage({ values = {}, error = '', success = '' } = {}) {
  return layout({
    title: 'Submit a pull request',
    active: '/submit',
    body: `
<section class="page-head">
  <p class="eyebrow">For contributors</p>
  <h1>Submit your pull request</h1>
  <p>One link per pull request. An organiser will check the work and assign points manually based on its complexity.</p>
</section>

<section class="narrow">
  ${flash(error, 'error')}
  ${flash(success, 'ok')}
  <form class="panel" method="post" action="/submit">
    <label>
      <span>Your name <span class="opt">(optional)</span></span>
      <input name="name" maxlength="60" value="${escape(values.name)}" placeholder="Ada Lovelace">
    </label>
    <label>
      <span>GitHub username</span>
      <div class="github-id-wrap">
        <input name="github_username" maxlength="40" required
               value="${escape(values.github_username)}" placeholder="ada" autocomplete="off">
        <div id="github-id-status" class="github-id-status" aria-live="polite"></div>
      </div>
    </label>
    <label>
      <span>Pull request link</span>
      <input name="pr_url" type="url" required value="${escape(values.pr_url)}"
             placeholder="https://github.com/owner/repo/pull/123">
    </label>
    <button class="btn primary" type="submit">Submit for review</button>
  </form>
</section>`,
    scripts: `<script src="/submit.js?v=${V}" defer></script>`,
  });
}

export function leaderboardPage({ rows }) {
  const body =
    rows.length === 0
      ? `<p class="empty">No approved submissions yet. Once organisers review the first
         pull requests, the standings appear here.</p>`
      : `<table class="board">
  <thead><tr><th>Standing</th><th>GitHub username</th><th>Total points</th></tr></thead>
  <tbody>
    ${rows
      .map(
        (r, i) => `<tr${i < 3 ? ` class="top top-${i + 1}"` : ''}>
      <td class="rank">${i + 1}</td>
      <td class="user">
        <a href="https://github.com/${escape(r.github_username)}" target="_blank"
           rel="noopener noreferrer">@${escape(r.github_username)}</a>
      </td>
      <td class="pts">${r.total_points}</td>
    </tr>`,
      )
      .join('\n    ')}
  </tbody>
</table>`;

  return layout({
    title: 'Leaderboard',
    active: '/leaderboard',
    body: `
<section class="page-head">
  <p class="eyebrow">Live standings</p>
  <h1>Leaderboard</h1>
  <p>Only reviewed and approved pull requests count. Ties break in favour of whoever reached
     the score first.</p>
</section>
<section class="narrow">${body}</section>`,
  });
}

export function adminLoginPage({ error = '', csrf }) {
  return layout({
    title: 'Admin login',
    active: '',
    body: `
<section class="page-head">
  <p class="eyebrow">Organisers only</p>
  <h1>Admin login</h1>
</section>
<section class="narrow">
  ${flash(error, 'error')}
  <form class="panel" method="post" action="/admin/login">
    <input type="hidden" name="csrf" value="${escape(csrf)}">
    <label>
      Password
      <input name="password" type="password" required autofocus>
    </label>
    <button class="btn primary" type="submit">Sign in</button>
  </form>
</section>`,
  });
}

function labelChips(labels) {
  if (!labels.length) return '<span class="chip none">no labels</span>';
  return labels.map((l) => `<span class="chip">${escape(l)}</span>`).join('');
}

function submissionRow(s, csrf) {
  const labels = readLabels(s);
  
  const techTeam = [
    "Avish Jain", "Anubhav Kumar", "Akshith N", "Kumkum Amarnath",
    "Tanya Pandey", "Kavyadeep Dev", "Adarsh A Ladwa", "Vishnu Mashalkar",
    "Shreya Ravish", "Arnav Kumar", "Parv D Parekh", "Adarsh KP"
  ];
  const options = techTeam.map(name => `<option value="${name}">${name}</option>`).join('');

  return `<form class="review" method="post" action="/admin/submissions/${s.id}/review" style="position: relative;">
  <input type="hidden" name="csrf" value="${escape(csrf)}">
  
  <!-- Assignee Dropdown -->
  <div style="position: absolute; top: 1rem; right: 1rem; display: flex; gap: 8px; align-items: center; background: #fff; padding: 4px 8px; border: 2px solid var(--ink); box-shadow: 2px 2px 0 var(--ink); z-index: 10;">
    <label style="font-weight: 900; font-size: 0.85rem; text-transform: uppercase;">Assign to:</label>
    <select class="assignee-select" data-id="${s.id}" style="border: 2px solid var(--ink); font-family: inherit; font-size: 0.9rem; padding: 2px; cursor: pointer; background: #fff;">
      <option value="" disabled selected>Select reviewer...</option>
      ${options}
    </select>
  </div>

  <div class="review-who">
    <img src="https://avatars.githubusercontent.com/${escape(s.github_username)}?s=64"
         alt="" width="36" height="36" loading="lazy"
         onerror="this.style.visibility='hidden'">
    <div>
      <strong>${escape(s.display_name || s.github_username)}</strong>
      <span>@${escape(s.github_username)} · submitted ${escape(s.submitted_at)} UTC</span>
    </div>
  </div>
  <a class="pr-link" href="${escape(s.pr_url)}" target="_blank" rel="noopener noreferrer">
    ${escape(s.pr_url)} ↗
  </a>
  <div class="score-row" style="margin-top: 12px; margin-bottom: 12px;">
    <span class="chips">${labelChips(labels)}</span>
  </div>
  <div class="review-controls">
    <!-- Manual Points Input -->
    <label class="note-in" style="max-width: 90px;"><span>Points</span>
      <input type="number" name="points" min="0" required placeholder="0">
    </label>
    <label class="note-in"><span>Note <span class="opt">(optional)</span></span>
      <input name="note" maxlength="300" value="${escape(s.note)}" placeholder="Reason, context…">
    </label>
    <button class="btn primary" name="action" value="approve" type="submit">
      Approve
    </button>
    <button class="btn danger" name="action" value="reject" type="submit">Reject</button>
  </div>
  </form>
  <form class="refresh" method="post" action="/admin/submissions/${s.id}/refresh">
    <input type="hidden" name="csrf" value="${escape(csrf)}">
    <button class="btn small ghost" type="submit">Re-check labels on GitHub</button>
  </form>`;
}

function reviewedRow(s, csrf) {
  const labels = readLabels(s);
  return `<tr class="st-${escape(s.status)}">
  <td><a href="https://github.com/${escape(s.github_username)}" target="_blank"
         rel="noopener noreferrer">@${escape(s.github_username)}</a></td>
  <td class="pr"><a href="${escape(s.pr_url)}" target="_blank" rel="noopener noreferrer">${escape(
    s.pr_url.replace('https://github.com/', ''),
  )}</a></td>
  <td class="labels"><span class="chips">${labelChips(labels)}</span></td>
  <td><span class="pill ${escape(s.status)}">${escape(s.status)}</span></td>
  <td class="pts">${s.points}</td>
  <td class="adjust">
    <form method="post" action="/admin/submissions/${s.id}/adjust">
      <input type="hidden" name="csrf" value="${escape(csrf)}">
      <input class="note-in" name="note" maxlength="300" value="${escape(s.note)}"
             placeholder="Reason…">
      ${
        s.status === 'approved'
          ? `<button class="btn small danger" name="action" value="revoke" type="submit">Revoke</button>`
          : `<button class="btn small primary" name="action" value="restore" type="submit">Restore</button>`
      }
    </form>
  </td>
</tr>`;
}

export function adminPage({ pending, reviewed, stats, csrf, flash: msg = '' }) {
  return layout({
    title: 'Admin',
    active: '',
    scripts: `
<script>
  // Lock the tech team dropdown menu to prevent changes after assignment
  document.querySelectorAll('.assignee-select').forEach(select => {
    const subId = select.getAttribute('data-id');
    const savedAssignee = localStorage.getItem('assignee_' + subId);
    
    if (savedAssignee) {
      select.value = savedAssignee;
      select.disabled = true;
      select.style.backgroundColor = '#e0e0e0';
      select.style.pointerEvents = 'none';
    }

    select.addEventListener('change', function() {
      if (this.value) {
        localStorage.setItem('assignee_' + subId, this.value);
        this.disabled = true;
        this.style.backgroundColor = '#e0e0e0';
        this.style.pointerEvents = 'none';
      }
    });
  });
</script>
    `,
    body: `
<section class="page-head admin-head">
  <div>
    <p class="eyebrow">Review queue</p>
    <h1>Admin</h1>
    <p>Open each one, check the work is real, assign points manually, then
     approve or reject it.</p>
  </div>
  <form method="post" action="/admin/logout">
    <input type="hidden" name="csrf" value="${escape(csrf)}">
    <button class="btn ghost" type="submit">Log out</button>
  </form>
</section>

<section class="narrow">
  ${flash(msg, 'ok')}
  <dl class="admin-stats">
    <div><dt data-count="${stats.pending}">${stats.pending}</dt><dd>Pending</dd></div>
    <div><dt data-count="${stats.approved}">${stats.approved}</dt><dd>Approved</dd></div>
    <div><dt data-count="${stats.participants}">${stats.participants}</dt><dd>Contributors</dd></div>
    <div><dt data-count="${stats.points}">${stats.points}</dt><dd>Points awarded</dd></div>
  </dl>

  <h2 class="sec">Pending (${pending.length})</h2>
  ${
    pending.length === 0
      ? '<p class="empty">Queue is clear. Nothing waiting for review.</p>'
      : pending.map((s) => submissionRow(s, csrf)).join('\n')
  }

  <h2 class="sec">Reviewed (${reviewed.length})</h2>
  <p class="hint" style="margin:-6px 0 14px">Revoking pulls the points off the leaderboard
     immediately. Restoring applies the points that were originally assigned.</p>
  ${
    reviewed.length === 0
      ? '<p class="empty">Nothing reviewed yet.</p>'
      : `<table class="board reviewed">
    <thead><tr><th>Who</th><th>PR</th><th>Labels</th><th>Status</th><th>Pts</th>
      <th>Revoke or reinstate</th></tr></thead>
    <tbody>${reviewed.map((s) => reviewedRow(s, csrf)).join('\n')}</tbody>
  </table>`
  }
</section>`,
  });
}

export function errorPage(status, message, back = '/') {
  const label = back === '/admin' ? 'Back to the review queue' : 'Back home';
  return layout({
    title: `${status}`,
    active: '',
    body: `<section class="page-head"><h1>${status}</h1><p>${escape(message)}</p>
      <p style="margin-top:22px"><a class="btn primary" href="${escape(back)}">${label}</a></p>
      </section>`,
  });
}

export function projectsView() {
  let tablesHtml = '';
  
  for (const [level, projects] of Object.entries(projectsData)) {
    if (projects.length === 0) continue;
    
    const rows = projects.map(p => `
      <tr>
        <td><strong>${escape(p.name)}</strong></td>
        <td><a href="${escape(p.link)}" target="_blank" class="comic-link">View Repo</a></td>
        <td>${escape(p.stack)}</td>
      </tr>
    `).join('');

    tablesHtml += `
      <section class="project-section" style="margin-bottom: 3rem;">
        <h2 class="section-title" style="font-size: 1.5rem; background: var(--ink); color: #fff; display: inline-block; padding: 4px 12px; margin-bottom: 12px; transform: skew(-5deg);">${level.charAt(0).toUpperCase() + level.slice(1)}</h2>
        <table class="board">
          <thead>
            <tr><th>Repository Name</th><th>Link</th><th>Tech Stack</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </section>
    `;
  }

  return layout({
    title: 'Projects',
    active: '/projects',
    body: `
<section class="page-head">
  <p class="eyebrow">Start contributing</p>
  <h1>Projects</h1>
  <p>Choose your difficulty and find a repository to work on.</p>
</section>
<section class="narrow">
  ${tablesHtml}
</section>
    `
  });
}

export function getStartedView() {
  return layout({
    title: 'Get Started',
    active: '/get-started',
    body: `
<section class="page-head">
  <p class="eyebrow">Learn the ropes</p>
  <h1>Get Started</h1>
  <p>Watch the tutorial below to learn how to contribute to the event.</p>
</section>
<section class="narrow">
  <div class="panel" style="padding: 0; overflow: hidden; border: 4px solid var(--ink); box-shadow: 8px 8px 0px var(--ink);">
    <iframe width="100%" height="500" src="https://www.youtube.com/embed/IKkJVt8TQwA?autoplay=1&mute=1&si=dQdFWHbdTb7drkTc" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen style="display: block;"></iframe>
  </div>
</section>
    `
  });
}

export function rulesPage() {
  return layout({
    title: 'Rules & Guidelines',
    active: '/rules',
    body: `
<section class="page-head">
  <p class="eyebrow">Official Document</p>
  <h1>Rules & Guidelines</h1>
  <p>Guided Real-World Open-Source Contribution Sprint</p>
</section>

<section class="narrow" style="line-height: 1.6;">
  <h2 class="sec">Document Information</h2>
  <table class="board" style="margin-bottom: 2rem;">
    <tbody>
      <tr><td><strong>Event Name</strong></td><td>COMMIT-ED</td></tr>
      <tr><td><strong>Event</strong></td><td>BMS Open Source Sprint 2026</td></tr>
      <tr><td><strong>Event Model</strong></td><td>Guided real-world open-source contribution sprint</td></tr>
      <tr><td><strong>Contribution Window</strong></td><td>Two-week sprint</td></tr>
      <tr><td><strong>Scoring Deadline</strong></td><td>August 23, 2026 (as referenced in the event plan)</td></tr>
      <tr><td><strong>Primary Audience</strong></td><td>Contributors, technical organisers, mentors and reviewers</td></tr>
      <tr><td><strong>Purpose</strong></td><td>Provide a controlled, authentic and high-quality open-source contribution experience</td></tr>
    </tbody>
  </table>

  <h2 class="sec">1. Event Overview</h2>
  <h3>1.1 Purpose of the Sprint</h3>
  <p>BMS Open Source Sprint 2026 is designed as a guided real-world open-source contribution sprint. Instead of limiting contributors to projects submitted by BMS students, the event will curate a fixed pool of active open-source repositories that are participating in programs such as GSSoC/SSoC or are actively accepting beginner and intermediate contributions.</p>
  <p>The objective is not simply to produce code or collect GitHub activity. The primary objective is to help each participant experience as much of the authentic open-source workflow as possible: identifying a suitable issue, communicating professionally with maintainers, obtaining assignment or approval where required, implementing a solution, testing it, opening a pull request, responding to review comments, and ultimately getting the work accepted or merged.</p>
  
  <div class="score-callout">
    <p><strong>Core Event Objective:</strong> Quality of contribution and understanding of the real open-source workflow are more important than the number of PRs submitted.</p>
  </div>

  <h3>1.2 Real Open-Source Workflow</h3>
  <ol style="margin-bottom: 2rem; padding-left: 1.5rem;">
    <li>Find a suitable issue in an approved repository.</li>
    <li>Read the repository documentation and contribution guidelines.</li>
    <li>Check whether the issue is already assigned or has an active PR.</li>
    <li>Submit the issue through the BMS internal Issue Claim Form.</li>
    <li>Wait for internal technical verification and difficulty assignment.</li>
    <li>Follow the upstream repository's rules for assignment, proposals or PR submission.</li>
    <li>Implement the solution and test it properly.</li>
    <li>Open the pull request according to the upstream project's guidelines.</li>
    <li>Submit the PR link through the BMS PR Submission Form.</li>
    <li>Respond to maintainer feedback and track the contribution through the milestones.</li>
  </ol>

  <h2 class="sec">2. Approved Repository Pool</h2>
  <p>Participants may initially contribute only to repositories approved by the organising and technical teams. The pool may be updated during the event if a maintainer becomes inactive, a repository stops accepting contributions, or a better contribution opportunity becomes available.</p>
  
  <h3>2.1 Beginner-Friendly Repositories</h3>
  <table class="board" style="margin-bottom: 2rem;">
    <thead><tr><th>Repository</th><th>Primary Technologies</th></tr></thead>
    <tbody>
      <tr><td>dhairyagothi/100_days_100_web_project</td><td>HTML / CSS / JavaScript</td></tr>
      <tr><td>MRIARC-08/VidyaSetu</td><td>React / Next.js / AI</td></tr>
      <tr><td>Venkat-Kolasani/FutureStack</td><td>React / JavaScript</td></tr>
      <tr><td>12fahed/CertiNova</td><td>TypeScript</td></tr>
      <tr><td>Mayur-Pagote/README_Design_Kit</td><td>Developer Documentation / Tooling</td></tr>
      <tr><td>darshan2456/C_DSA_interactive_suite</td><td>C / DSA</td></tr>
      <tr><td>PRODHOSH/gssoc-tracker</td><td>Next.js / TypeScript</td></tr>
    </tbody>
  </table>

  <h3>2.2 Intermediate Repositories</h3>
  <table class="board" style="margin-bottom: 2rem;">
    <thead><tr><th>Repository</th><th>Primary Technologies</th></tr></thead>
    <tbody>
      <tr><td>Ruthwik000/tokenfirewall</td><td>TypeScript / LLM Infrastructure</td></tr>
      <tr><td>im-anishraj/arnio</td><td>Python / Data Science / C++</td></tr>
      <tr><td>riteshbonthalakoti/HELPDESK.AI</td><td>FastAPI / React / AI</td></tr>
      <tr><td>kalyan-1845/ai-code-reviewer</td><td>AI / Security / Web</td></tr>
      <tr><td>itzzavdhesh/VoiceForge</td><td>AI / Accessibility</td></tr>
      <tr><td>SamXop123/samdev-pulse</td><td>JavaScript / GitHub API</td></tr>
      <tr><td>Shivayan09/Vector-social-media</td><td>Next.js / Node.js / MongoDB</td></tr>
      <tr><td>ManabBiswas/EkagraFocus</td><td>Electron / React / TypeScript</td></tr>
      <tr><td>Abhigyan-Shekhar/Waggle-mcp</td><td>Python 3.11+, SQLite, Neo4j, MCP, React, Vite</td></tr>
    </tbody>
  </table>

  <h3>2.3 Advanced Repositories</h3>
  <table class="board" style="margin-bottom: 2rem;">
    <thead><tr><th>Repository</th><th>Primary Technologies</th></tr></thead>
    <tbody>
      <tr><td>RatLoopz/sahidawa-india</td><td>Next.js / TypeScript / Security / Testing</td></tr>
      <tr><td>NEXARA-oss/PulseStack</td><td>AI Infrastructure / Observability</td></tr>
      <tr><td>OWASP-BLT/BLT</td><td>Python / Cybersecurity</td></tr>
    </tbody>
  </table>

  <h2 class="sec">3. Mandatory Internal Approval System</h2>
  <p>Participants must not randomly begin coding on issues. Every scoring contribution must first pass through the BMS internal approval process. This provides coordination, prevents duplicate work, protects external maintainers from unnecessary activity, and allows the technical team to assign a consistent internal difficulty level.</p>
  
  <h3>3.1 Issue Claim and Approval Process</h3>
  <ol style="margin-bottom: 2rem; padding-left: 1.5rem;">
    <li>Choose a repository from the approved repository pool.</li>
    <li>Find an existing open issue suitable for your skill level.</li>
    <li>Check whether another contributor is already assigned or has opened a PR.</li>
    <li>Read the repository's README, CONTRIBUTING guidelines, issue instructions and relevant documentation.</li>
    <li>Submit the issue to the BMS internal Issue Claim Form.</li>
    <li>The technical team verifies the issue and approves the claim.</li>
    <li>After approval, contact the upstream maintainer or request assignment according to that repository's rules.</li>
    <li>Begin implementation only after satisfying the upstream project's requirements.</li>
    <li>Open a legitimate, tested PR and submit its link through the BMS PR Submission Form.</li>
    <li>The organising team tracks milestones according to the scoring system.</li>
  </ol>
  
  <div class="score-callout">
    <p><strong>Important:</strong> Internal approval does not replace upstream approval. It only coordinates BMS participants and validates the task for event scoring.</p>
  </div>

  <h2 class="sec">4. Upstream Repository Rules Take Priority</h2>
  <p>Every contribution must comply with the contribution policy of the external repository. BMS Open Source Sprint rules cannot override the rules established by repository maintainers.</p>
  <table class="board" style="margin-bottom: 2rem;">
    <thead><tr><th>If the repository says...</th><th>The contributor must...</th></tr></thead>
    <tbody>
      <tr><td>Ask for assignment before working</td><td>Wait for and obtain assignment before starting implementation.</td></tr>
      <tr><td>Do not ask for assignment; submit a PR</td><td>Follow that workflow instead of requesting assignment.</td></tr>
      <tr><td>Submit an implementation proposal first</td><td>Prepare and submit the required proposal before coding.</td></tr>
      <tr><td>No drive-by/event contributions</td><td>Do not contribute; the organising team should remove it from the approved pool.</td></tr>
    </tbody>
  </table>
  <p>Contributors are expected to communicate respectfully with maintainers, follow repository etiquette, and never use the event as a reason to pressure maintainers into accepting work.</p>

  <h2 class="sec">5. Contribution Tracks</h2>
  <h3>5.1 Track A — First Open-Source Contribution</h3>
  <p>This track is intended for beginners experiencing authentic open source for the first time. The goal is to complete one proper contribution lifecycle rather than maximize the number of PRs.</p>
  <ul style="margin-bottom: 1.5rem; padding-left: 1.5rem;">
    <li>Small bug fixes</li>
    <li>Good-first issues</li>
    <li>Tests and test improvements</li>
    <li>Documentation improvements</li>
    <li>UI fixes</li>
    <li>Validation fixes</li>
    <li>Accessibility improvements</li>
  </ul>

  <h3>5.2 Track B — Open Source Challenge</h3>
  <p>This track is intended for experienced contributors ready to attempt technically deeper work.</p>
  <ul style="margin-bottom: 2rem; padding-left: 1.5rem;">
    <li>Intermediate bugs</li>
    <li>New features</li>
    <li>Performance improvements</li>
    <li>Testing infrastructure</li>
    <li>CI/CD improvements</li>
    <li>Security fixes</li>
    <li>Backend integrations</li>
    <li>Larger technical contributions</li>
  </ul>
  <p>Both tracks participate in the same leaderboard. Difficulty and technical scope determine the recognition awarded.</p>

  <h2 class="sec">6. Issues Created by Contributors</h2>
  <p>Participants may discover genuine bugs or useful feature requests that are not already documented. Simply opening an issue is not enough, preventing unnecessary issue creation and protecting external repositories from spam.</p>
  <ul style="margin-bottom: 1.5rem; padding-left: 1.5rem;">
    <li>Maintainer confirms it is a genuine bug.</li>
    <li>Maintainer applies a relevant label.</li>
    <li>Maintainer explicitly confirms the issue as valid.</li>
    <li>Maintainer accepts the feature request.</li>
    <li>The issue directly leads to an accepted PR.</li>
  </ul>
  <p style="margin-bottom: 2rem;">A high-quality, externally validated issue may be approved for credit after verification by the BMS technical team.</p>

  <h2 class="sec">7. Activities That Do Not Count</h2>
  <ul style="margin-bottom: 1.5rem; padding-left: 1.5rem;">
    <li>Starring repositories</li>
    <li>Forking repositories</li>
    <li>Random GitHub comments</li>
    <li>Opening unnecessary issues</li>
    <li>Typo-only PRs</li>
    <li>Adding your name to contributor files</li>
    <li>README formatting-only changes</li>
    <li>Artificially splitting one task into several PRs</li>
    <li>Submitting code without testing</li>
    <li>PRs rejected as spam</li>
    <li>PRs copied from existing contributors</li>
    <li>AI-generated PRs that the contributor cannot explain</li>
    <li>Repositories where the only contribution is adding your name as a first contribution</li>
  </ul>
  <div class="score-callout" style="margin-bottom: 2rem;"><p><strong>Quality > Quantity:</strong> The event rewards meaningful software contributions and authentic open-source participation, not raw GitHub activity.</p></div>

  <h2 class="sec">8. Artificial Intelligence (AI) Policy</h2>
  <p>AI tools may be used as learning and development assistants, but participants remain fully responsible for the code and content they submit. Every contributor must understand, test and be able to explain their contribution.</p>
  
  <h3>8.1 Permitted Uses</h3>
  <ul style="margin-bottom: 1.5rem; padding-left: 1.5rem;">
    <li>Learning and understanding unfamiliar concepts</li>
    <li>Understanding existing code</li>
    <li>Debugging assistance</li>
    <li>Brainstorming possible approaches</li>
    <li>Test generation assistance</li>
    <li>Documentation assistance</li>
  </ul>

  <h3>8.2 Verification of Suspicious Contributions</h3>
  <p>If a PR appears suspicious, excessively generated, copied, or inconsistent with the contributor's demonstrated understanding, the technical team may ask the contributor to:</p>
  <ul style="margin-bottom: 1.5rem; padding-left: 1.5rem;">
    <li>Explain the issue and intended solution.</li>
    <li>Explain the submitted code and important functions.</li>
    <li>Run the project and demonstrate the change.</li>
    <li>Explain important design decisions.</li>
    <li>Make a small live modification to demonstrate understanding.</li>
  </ul>
  <p style="margin-bottom: 2rem;">If the contributor cannot explain or demonstrate the contribution, it may be rejected from event scoring. Repeated AI-spam, plagiarism, or deliberate misrepresentation may result in disqualification.</p>

  <h2 class="sec">9. Issue Claiming Limits and Inactivity</h2>
  <ul style="margin-bottom: 2rem; padding-left: 1.5rem;">
    <li>To prevent contributors from reserving large numbers of issues without working on them, the event will initially allow one active scoring issue per contributor.</li>
    <li>A contributor may request another issue after their first PR has been submitted or the current contribution is meaningfully progressing.</li>
    <li>Contributors should provide updates when work is delayed or blocked.</li>
    <li>If a contributor remains inactive for 48 hours without an update, the internal claim may be released for another participant.</li>
    <li>Releasing an inactive claim is intended to keep the issue pool available to active contributors and does not automatically imply misconduct.</li>
  </ul>

  <h2 class="sec">10. Event Operations and Tracking</h2>
  <h3>10.1 Internal Systems</h3>
  <ul style="margin-bottom: 1.5rem; padding-left: 1.5rem;">
    <li>Issue Claim Form — request an issue for internal verification.</li>
    <li>PR Submission Form — submit PR links and trigger milestone tracking.</li>
    <li>Leaderboard Sheet/Database — record validated milestones.</li>
    <li>Contributor Communication Group — announcements, support and coordination.</li>
    <li>Technical Domain Assignments — organisers/mentors assigned to Web, Python, AI, C/C++, Cybersecurity and other domains.</li>
  </ul>

  <h3>10.2 Recommended Contribution Record</h3>
  <table class="board" style="margin-bottom: 2rem;">
    <thead><tr><th>Field</th><th>Purpose</th></tr></thead>
    <tbody>
      <tr><td>Contributor ID / Name</td><td>Identify the participant</td></tr>
      <tr><td>Repository</td><td>Track the external project</td></tr>
      <tr><td>Issue Number / Link</td><td>Identify the claimed task</td></tr>
      <tr><td>Internal Difficulty</td><td>Record Level 1–4</td></tr>
      <tr><td>Claim Date</td><td>Track when work was approved</td></tr>
      <tr><td>PR Link</td><td>Track the submitted contribution</td></tr>
      <tr><td>Testing / CI Status</td><td>Verify quality milestone</td></tr>
      <tr><td>Maintainer Review</td><td>Record external review</td></tr>
      <tr><td>Review Addressed</td><td>Record response to feedback</td></tr>
      <tr><td>Approval / Merge</td><td>Record upstream outcome</td></tr>
    </tbody>
  </table>

  <h2 class="sec">11. Contributor Code of Conduct and Etiquette</h2>
  <ul style="margin-bottom: 2rem; padding-left: 1.5rem;">
    <li>Communicate respectfully with maintainers and other contributors.</li>
    <li>Read repository documentation before asking questions.</li>
    <li>Do not repeatedly ping or pressure maintainers for assignment or review.</li>
    <li>Do not claim an issue already assigned to someone else.</li>
    <li>Do not submit unfinished or untested code.</li>
    <li>Clearly communicate blockers to the BMS technical team.</li>
    <li>Respect the external project's contribution guidelines, license and code of conduct.</li>
    <li>Represent BMSCE professionally in all external project interactions.</li>
  </ul>

  <h2 class="sec">12. Quality Control and Disqualification</h2>
  <p>The organising and technical teams may reject event credit for contributions that are clearly low-quality, misleading, duplicated, spam-like, plagiarized, artificially inflated, or inconsistent with the event rules.</p>
  <ul style="margin-bottom: 2rem; padding-left: 1.5rem;">
    <li>Duplicate or competing contributions may be rejected from scoring.</li>
    <li>Spam PRs or unnecessary issues will be rejected.</li>
    <li>Plagiarized or copied contributions may result in disqualification.</li>
    <li>Repeated inability to explain submitted work may result in disqualification under the AI policy.</li>
    <li>Attempts to manipulate the leaderboard or split one task artificially may result in submission cancellation and further review.</li>
  </ul>

  <h2 class="sec">13. Final Event Principle</h2>
  <div class="score-callout" style="margin-bottom: 2rem;">
    <p><strong>The goal is not to create the most PRs.</strong> The goal is to help every participant experience authentic open-source contribution: finding a real problem, communicating with a real maintainer, writing and testing a real solution, receiving feedback, improving the work, and contributing responsibly to a real project.</p>
  </div>
</section>
    `
  });
}