import { POINTS } from './points.js';
import { readLabels } from './db.js';
import { scoreSummary } from './points.js';

export function escape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Changes on every boot, so a restarted server never serves a page that
    points at a browser-cached stylesheet or script from the previous build. */
const V = Date.now().toString(36);

const NAV = [
  ['/', 'Home'],
  ['/badge', 'Badge'],
  ['/submit', 'Submit PR'],
  ['/projects', 'Projects'],
  ['/leaderboard', 'Leaderboard'],
];

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
<header class="site-head">
  <a class="brand" href="/">COMMIT<span>-ed</span>.</a>
  <nav>
    ${NAV.map(
      ([href, label]) =>
        `<a href="${href}"${active === href ? ' class="active"' : ''}>${label}</a>`,
    ).join('\n    ')}
  </nav>
  <a class="cta" href="/badge">Get your badge</a>
</header>
<main>
${body}
</main>
<footer class="site-foot">
  <span>COMMIT-ed · build in public with your campus community</span>
  <a href="https://protocolbmsce.in/core">About us</a>
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

function scoreCallout(scored) {
  if (!scored) return '';
  const chips = scored.labels.length
    ? `<p class="chips">${scored.labels
        .map((l) => `<span class="chip">${escape(l)}</span>`)
        .join('')}</p>`
    : '';
  const line = scored.tier
    ? `This pull request is labelled <strong>${escape(scored.tier)}</strong> — worth
       <strong>${scored.points} points</strong> once an organiser approves it.`
    : escape(
        scored.error ||
          'No difficulty label on it yet. Once the project admin adds one, it will be worth ' +
            'points — an organiser re-checks at review time.',
      );
  return `<div class="score-callout"><p>${line}</p>${chips}</div>`;
}

export function submitPage({ values = {}, error = '', success = '', scored = null } = {}) {
  return layout({
    title: 'Submit a pull request',
    active: '/submit',
    body: `
<section class="page-head">
  <p class="eyebrow">For contributors</p>
  <h1>Submit your pull request</h1>
  <p>One link per pull request. We read its difficulty label to work out the points; an
     organiser then checks the work and approves it.</p>
</section>

<section class="narrow">
  ${flash(error, 'error')}
  ${flash(success, 'ok')}
  ${scoreCallout(scored)}
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
    <p class="hint">Points come from the difficulty label the project admin put on your pull
       request — <strong>easy ${POINTS.easy}</strong>, <strong>medium ${POINTS.medium}</strong>,
       <strong>hard ${POINTS.hard}</strong>. Nothing counts until an organiser checks the work
       and approves it.</p>
  </form>
</section>`,
    scripts: `<script src="/submit.js?v=${V}" defer></script>`,
  });
}

export function projectsPage({ projects }) {
  const content =
    projects.length === 0
      ? `<div class="panel empty-projects">
          <h2>No submitted repositories yet</h2>
          <p>As contributors submit pull requests, the repositories will automatically appear here with their descriptions and tech stacks.</p>
          <div class="row" style="margin-top: 12px;">
            <a class="btn primary" href="/submit">Submit a pull request →</a>
          </div>
        </div>`
      : `<div class="projects-grid">
    ${projects
      .map((p) => {
        const techChips = p.techStack.length
          ? p.techStack
              .map((tech) => `<span class="tech-chip">${escape(tech)}</span>`)
              .join('')
          : '<span class="tech-chip">Open Source</span>';

        return `<article class="project-card">
          <div class="project-card-header">
            <div class="repo-name-group">
              <span class="tag">Repo</span>
              <h2><a href="${escape(p.repoUrl)}" target="_blank" rel="noopener noreferrer">${escape(p.fullName)} ↗</a></h2>
            </div>
            ${p.stars ? `<span class="star-badge" title="GitHub Stars">★ ${p.stars}</span>` : ''}
          </div>
          <p class="project-desc">${escape(p.description)}</p>

          <div class="tech-stack-section">
            <span class="tech-label">Tech Stack</span>
            <div class="tech-chips">${techChips}</div>
          </div>

          <div class="project-footer">
            <div class="project-stats">
              <span title="Total PRs submitted"><strong>${p.totalPrs}</strong> PR${p.totalPrs === 1 ? '' : 's'}</span>
              <span title="Approved PRs"><strong>${p.approvedPrs}</strong> Approved</span>
              <span title="Unique Contributors"><strong>${p.contributorsCount}</strong> Contributor${p.contributorsCount === 1 ? '' : 's'}</span>
            </div>
            <div class="project-actions">
              <a class="btn small primary" href="/submit">Submit PR</a>
              <a class="btn small ghost" href="${escape(p.repoUrl)}" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
            </div>
          </div>
        </article>`;
      })
      .join('\n')}
  </div>`;

  return layout({
    title: 'Submitted Projects',
    active: '/projects',
    body: `
<section class="page-head">
  <p class="eyebrow">Event Repositories</p>
  <h1>Submitted Projects</h1>
  <p>Explore all submitted open-source repositories, discover their tech stacks, and start contributing to earn leaderboard points!</p>
</section>
<section class="projects-section">${content}</section>`,
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
  const score = scoreSummary(labels, s.label_error);
  return `<form class="review" method="post" action="/admin/submissions/${s.id}/review">
  <input type="hidden" name="csrf" value="${escape(csrf)}">
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
  <div class="score-row">
    <span class="worth ${score.tier ? 'has-tier' : 'no-tier'}">${score.points} pts</span>
    <span class="chips">${labelChips(labels)}</span>
    <span class="score-note">${escape(score.tier ? `labelled ${score.tier}` : score.text)}</span>
  </div>
  <div class="review-controls">
    <label class="note-in"><span>Note <span class="opt">(optional)</span></span>
      <input name="note" maxlength="300" value="${escape(s.note)}" placeholder="Reason, context…">
    </label>
    <button class="btn primary" name="action" value="approve" type="submit">
      Approve ${score.points} pts
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
  const score = scoreSummary(labels, s.label_error);
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
          : `<button class="btn small primary" name="action" value="restore" type="submit">
               Approve ${score.points} pts
             </button>`
      }
    </form>
  </td>
</tr>`;
}

export function adminPage({ pending, reviewed, stats, csrf, flash: msg = '' }) {
  return layout({
    title: 'Admin',
    active: '',
    body: `
<section class="page-head admin-head">
  <div>
    <p class="eyebrow">Review queue</p>
    <h1>Admin</h1>
    <p>Points come from the pull request's difficulty label — easy ${POINTS.easy}, medium
     ${POINTS.medium}, hard ${POINTS.hard}. Open each one, check the work is real, then
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
     immediately. Reinstating re-reads the label and awards it again.</p>
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
