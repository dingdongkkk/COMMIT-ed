export function escape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const NAV = [
  ['/', 'Home'],
  ['/badge', 'Badge'],
  ['/submit', 'Submit PR'],
  ['/leaderboard', 'Leaderboard'],
];

export function layout({ title, active, body, head = '', scripts = '' }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)} · COMMIT-ed</title>
<link rel="stylesheet" href="/app.css">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎯</text></svg>">
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
  <a href="/admin">Admin</a>
</footer>
${scripts}
</body>
</html>`;
}

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
  <div class="hero-copy">
    <h1><span class="script">COMMIT-ed</span><br>Open Source Season</h1>
    <p>Build in public with your campus community. Grab a contributor badge, ship a pull
       request, and watch the leaderboard move.</p>
    <div class="hero-actions">
      <a class="btn primary" href="/badge">Generate my badge</a>
      <a class="btn ghost" href="/submit">Submit a pull request</a>
    </div>
    <dl class="hero-stats">
      <div><dt>${stats.participants}</dt><dd>Contributors</dd></div>
      <div><dt>${stats.approved}</dt><dd>Approved PRs</dd></div>
      <div><dt>${stats.points}</dt><dd>Points awarded</dd></div>
    </dl>
  </div>
  <div class="hero-card">
    <div class="term">
      <div class="term-bar"><i></i><i></i><i></i><span>season.ts</span></div>
      <pre><code><span class="k">const</span> season = openSource.<span class="f">start</span>({
  window: <span class="s">'4 weeks'</span>,
  level:  <span class="s">'anyone'</span>,
  review: <span class="s">'by a human'</span>,
});</code></pre>
      <div class="term-foot"><span class="pass">badge ready</span><span>leaderboard synced</span></div>
    </div>
  </div>
</section>

<section class="cards">
  <article class="card">
    <span class="tag">Step one</span>
    <h2>Get your badge</h2>
    <p>Enter your name and GitHub handle. We render a contributor card you can download and
       post anywhere.</p>
    <a href="/badge">Make my badge →</a>
  </article>
  <article class="card">
    <span class="tag">Step two</span>
    <h2>Submit your PR</h2>
    <p>Paste the link to your pull request. It lands in the review queue as pending.</p>
    <a href="/submit">Submit a link →</a>
  </article>
  <article class="card">
    <span class="tag">Step three</span>
    <h2>Reviewed by a human</h2>
    <p>An organiser opens your PR, reads the diff, and types in the points it earned. No bots,
       no auto-scoring.</p>
    <a href="/leaderboard">See the scoring →</a>
  </article>
  <article class="card">
    <span class="tag">Step four</span>
    <h2>Climb the leaderboard</h2>
    <p>Approved points stack up. Ties break in favour of whoever got there first.</p>
    <a href="/leaderboard">View leaderboard →</a>
  </article>
</section>`,
  });
}

export function badgePage() {
  return layout({
    title: 'Contributor badge',
    active: '/badge',
    body: `
<section class="page-head">
  <p class="eyebrow">Contributor badge</p>
  <h1>Get your badge</h1>
  <p>Fill in your details, preview your badge and download it as an image you can post
     anywhere.</p>
</section>

<section class="badge-layout">
  <form class="panel" id="badge-form" autocomplete="off">
    <label>
      Full name
      <input id="f-name" name="name" maxlength="60" placeholder="Ada Lovelace" required>
    </label>
    <label>
      GitHub username
      <input id="f-username" name="username" maxlength="39" placeholder="ada" required
             pattern="[A-Za-z0-9-]{1,39}">
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
      Accent
      <span class="swatches" id="f-accent">
        <button type="button" class="sw selected" data-accent="#f2547d" style="--sw:#f2547d"></button>
        <button type="button" class="sw" data-accent="#7c6cff" style="--sw:#7c6cff"></button>
        <button type="button" class="sw" data-accent="#25c2a0" style="--sw:#25c2a0"></button>
        <button type="button" class="sw" data-accent="#f2a03d" style="--sw:#f2a03d"></button>
      </span>
    </label>
    <p class="hint" id="badge-hint">The avatar comes straight from your GitHub profile
       picture.</p>
    <div class="row">
      <button type="button" class="btn primary" id="btn-download">Download PNG</button>
      <a class="btn ghost" href="/submit">Next: submit a PR</a>
    </div>
  </form>

  <div class="badge-preview">
    <canvas id="badge-canvas" width="1000" height="600" aria-label="Badge preview"></canvas>
  </div>
</section>`,
    scripts: '<script src="/badge.js" defer></script>',
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
  <p>One link per pull request. An organiser reviews it by hand and assigns the points.</p>
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
      GitHub username
      <input name="github_username" maxlength="40" required
             value="${escape(values.github_username)}" placeholder="ada">
    </label>
    <label>
      Pull request link
      <input name="pr_url" type="url" required value="${escape(values.pr_url)}"
             placeholder="https://github.com/owner/repo/pull/123">
    </label>
    <button class="btn primary" type="submit">Submit for review</button>
    <p class="hint">Submitting does not award points. Your PR shows up as
       <strong>pending</strong> until an organiser reviews it.</p>
  </form>
</section>`,
  });
}

export function leaderboardPage({ rows }) {
  const body =
    rows.length === 0
      ? `<p class="empty">No approved submissions yet. Once organisers review the first
         pull requests, the standings appear here.</p>`
      : `<table class="board">
  <thead><tr><th>#</th><th>Contributor</th><th>PRs</th><th>Points</th></tr></thead>
  <tbody>
    ${rows
      .map(
        (r, i) => `<tr${i < 3 ? ` class="top top-${i + 1}"` : ''}>
      <td class="rank">${i + 1}</td>
      <td class="who">
        <img src="https://avatars.githubusercontent.com/${escape(r.github_username)}?s=64"
             alt="" width="32" height="32" loading="lazy"
             onerror="this.style.visibility='hidden'">
        <span>
          <strong>${escape(r.display_name || r.github_username)}</strong>
          <a href="https://github.com/${escape(r.github_username)}" target="_blank"
             rel="noopener noreferrer">@${escape(r.github_username)}</a>
        </span>
      </td>
      <td>${r.prs}</td>
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

function submissionRow(s, csrf) {
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
  <div class="review-controls">
    <label class="pts-in">Points
      <input name="points" type="number" min="0" max="1000" step="1" value="${s.points}">
    </label>
    <label class="note-in"><span>Note <span class="opt">(optional)</span></span>
      <input name="note" maxlength="300" value="${escape(s.note)}" placeholder="Reason, context…">
    </label>
    <button class="btn primary" name="action" value="approve" type="submit">Approve</button>
    <button class="btn danger" name="action" value="reject" type="submit">Reject</button>
  </div>
</form>`;
}

function reviewedRow(s) {
  return `<tr class="st-${escape(s.status)}">
  <td><a href="https://github.com/${escape(s.github_username)}" target="_blank"
         rel="noopener noreferrer">@${escape(s.github_username)}</a></td>
  <td class="pr"><a href="${escape(s.pr_url)}" target="_blank" rel="noopener noreferrer">${escape(
    s.pr_url.replace('https://github.com/', ''),
  )}</a></td>
  <td><span class="pill ${escape(s.status)}">${escape(s.status)}</span></td>
  <td class="pts">${s.points}</td>
  <td class="note">${escape(s.note)}</td>
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
    <p>Open each pull request, read the diff, then type in the points it earned.</p>
  </div>
  <form method="post" action="/admin/logout">
    <input type="hidden" name="csrf" value="${escape(csrf)}">
    <button class="btn ghost" type="submit">Log out</button>
  </form>
</section>

<section class="narrow">
  ${flash(msg, 'ok')}
  <dl class="admin-stats">
    <div><dt>${stats.pending}</dt><dd>Pending</dd></div>
    <div><dt>${stats.approved}</dt><dd>Approved</dd></div>
    <div><dt>${stats.participants}</dt><dd>Contributors</dd></div>
    <div><dt>${stats.points}</dt><dd>Points awarded</dd></div>
  </dl>

  <h2 class="sec">Pending (${pending.length})</h2>
  ${
    pending.length === 0
      ? '<p class="empty">Queue is clear. Nothing waiting for review.</p>'
      : pending.map((s) => submissionRow(s, csrf)).join('\n')
  }

  <h2 class="sec">Reviewed (${reviewed.length})</h2>
  ${
    reviewed.length === 0
      ? '<p class="empty">Nothing reviewed yet.</p>'
      : `<table class="board reviewed">
    <thead><tr><th>Who</th><th>PR</th><th>Status</th><th>Points</th><th>Note</th></tr></thead>
    <tbody>${reviewed.map(reviewedRow).join('\n')}</tbody>
  </table>`
  }
</section>`,
  });
}

export function errorPage(status, message) {
  return layout({
    title: `${status}`,
    active: '',
    body: `<section class="page-head"><h1>${status}</h1><p>${escape(message)}</p>
      <p><a class="btn ghost" href="/">Back home</a></p></section>`,
  });
}
