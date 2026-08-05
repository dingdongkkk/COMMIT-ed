/* Contributor badge generator — renders to canvas so it can be downloaded as a PNG. */

const canvas = document.getElementById('badge-canvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const nameInput = document.getElementById('f-name');
const userInput = document.getElementById('f-username');
const roleInput = document.getElementById('f-role');
const accentBox = document.getElementById('f-accent');
const hint = document.getElementById('badge-hint');

const state = { name: '', username: '', role: 'Contributor', accent: '#f2547d' };

/** Avatars are cached per username so typing does not refetch on every keystroke. */
const avatars = new Map();
let avatar = null;

const FONT = '"Segoe UI", system-ui, -apple-system, Helvetica, Arial, sans-serif';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

function hexToRgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitText(text, maxWidth, startSize, weight = '700') {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${FONT}`;
  while (ctx.measureText(text).width > maxWidth && size > 22) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${FONT}`;
  }
  return size;
}

function loadAvatar(username) {
  if (!username) {
    avatar = null;
    return;
  }
  if (avatars.has(username)) {
    avatar = avatars.get(username);
    draw();
    return;
  }
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.referrerPolicy = 'no-referrer';
  img.onload = () => {
    avatars.set(username, img);
    if (state.username === username) {
      avatar = img;
      draw();
    }
  };
  img.onerror = () => {
    avatars.set(username, null);
    if (state.username === username) {
      avatar = null;
      hint.textContent = `Could not load the avatar for @${username} — the badge still works.`;
      draw();
    }
  };
  img.src = `https://avatars.githubusercontent.com/${encodeURIComponent(username)}?s=400`;
}

function drawAvatar(cx, cy, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (avatar) {
    ctx.drawImage(avatar, cx - r, cy - r, r * 2, r * 2);
  } else {
    ctx.fillStyle = '#1c1c26';
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    const initials = (state.name || state.username || '?')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
    ctx.fillStyle = state.accent;
    ctx.font = `700 ${r}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials || '?', cx, cy + 2);
  }
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
  ctx.strokeStyle = state.accent;
  ctx.lineWidth = 5;
  ctx.stroke();
}

function draw() {
  const accent = state.accent;
  ctx.clearRect(0, 0, W, H);

  // Card background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#111119');
  bg.addColorStop(1, '#08080c');
  ctx.fillStyle = bg;
  roundRect(0, 0, W, H, 34);
  ctx.fill();

  // Accent glow, top right
  const glow = ctx.createRadialGradient(W - 120, -60, 20, W - 120, -60, 520);
  glow.addColorStop(0, hexToRgba(accent, 0.34));
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  roundRect(0, 0, W, H, 34);
  ctx.fill();

  // Faint grid
  ctx.save();
  roundRect(0, 0, W, H, 34);
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.restore();

  // Border
  roundRect(1.5, 1.5, W - 3, H - 3, 33);
  ctx.strokeStyle = 'rgba(255,255,255,0.09)';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // Brand row
  ctx.fillStyle = '#f4f4f6';
  ctx.font = `700 30px ${FONT}`;
  ctx.fillText('COMMIT', 64, 84);
  const brandW = ctx.measureText('COMMIT').width;
  ctx.fillStyle = accent;
  ctx.fillText('-ed', 64 + brandW, 84);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#8a8a99';
  ctx.font = `600 15px ${MONO}`;
  ctx.fillText('OPEN SOURCE SEASON', W - 64, 82);
  ctx.textAlign = 'left';

  // Avatar
  const cx = 178;
  const cy = 318;
  const r = 96;
  drawAvatar(cx, cy, r);

  // Identity
  const left = 320;
  const name = state.name || 'Your Name';
  const size = fitText(name, W - left - 70, 58);
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${size}px ${FONT}`;
  ctx.fillText(name, left, 300);

  ctx.fillStyle = '#9a9aa8';
  ctx.font = `500 24px ${MONO}`;
  ctx.fillText(`@${state.username || 'github-handle'}`, left, 344);

  // Role pill
  ctx.font = `600 18px ${FONT}`;
  const role = state.role;
  const pillW = ctx.measureText(role).width + 40;
  roundRect(left, 372, pillW, 42, 21);
  ctx.fillStyle = hexToRgba(accent, 0.16);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(accent, 0.55);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.fillText(role, left + 20, 399);

  // Footer
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(64, 496);
  ctx.lineTo(W - 64, 496);
  ctx.stroke();

  ctx.fillStyle = '#6f6f7d';
  ctx.font = `500 16px ${MONO}`;
  ctx.fillText('build in public with your campus community', 64, 536);
  ctx.textAlign = 'right';
  ctx.fillStyle = accent;
  ctx.fillText('#COMMITed', W - 64, 536);
  ctx.textAlign = 'left';
}

function sync() {
  state.name = nameInput.value.trim().replace(/\s+/g, ' ').slice(0, 60);
  const username = userInput.value.trim().replace(/^@/, '');
  state.role = roleInput.value;
  if (username !== state.username) {
    state.username = username;
    avatar = null;
    hint.textContent = 'The avatar comes straight from your GitHub profile picture.';
    loadAvatar(username);
  }
  draw();
}

let debounce;
for (const el of [nameInput, userInput, roleInput]) {
  el.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(sync, 200);
  });
}

accentBox.addEventListener('click', (event) => {
  const button = event.target.closest('.sw');
  if (!button) return;
  for (const sw of accentBox.querySelectorAll('.sw')) sw.classList.remove('selected');
  button.classList.add('selected');
  state.accent = button.dataset.accent;
  draw();
});

document.getElementById('badge-form').addEventListener('submit', (e) => e.preventDefault());

document.getElementById('btn-download').addEventListener('click', () => {
  if (!userInput.value.trim()) {
    hint.textContent = 'Add your GitHub username first.';
    userInput.focus();
    return;
  }
  sync();
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commit-ed-badge-${state.username || 'contributor'}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
});

draw();
