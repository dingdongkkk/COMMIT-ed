/* Contributor badge generator — renders to canvas so it can be downloaded as a PNG. */

const canvas = document.getElementById('badge-canvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const nameInput = document.getElementById('f-name');
const userInput = document.getElementById('f-username');
const roleInput = document.getElementById('f-role');
const themeBox = document.getElementById('f-theme');
const hint = document.getElementById('badge-hint');

const THEMES = {
  gwen: { accent: '#ff4fa3', secondary: '#37e6e6', bg1: '#241344', bg2: '#0d0620' },
};

const state = {
  name: '',
  username: '',
  role: 'Contributor',
  // Overwritten by the selected chip; Spider-Gwen is the default suit.
  theme: THEMES.gwen,
};

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
    ctx.fillStyle = state.theme.accent;
    ctx.font = `700 ${r}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials || '?', cx, cy + 2);
  }
  ctx.restore();

  // Ring blends the suit's two colours.
  const ring = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  ring.addColorStop(0, state.theme.accent);
  ring.addColorStop(1, state.theme.secondary);
  ctx.beginPath();
  ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
  ctx.strokeStyle = ring;
  ctx.lineWidth = 5;
  ctx.stroke();
}

/** Radial web in a corner: spokes plus catenary-ish cross strands. */
function drawWeb(cx, cy, radius, rings, spokes, from, to, color) {
  const step = (to - from) / spokes;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;

  for (let i = 0; i <= spokes; i += 1) {
    const a = from + step * i;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
    ctx.stroke();
  }

  for (let ring = 1; ring <= rings; ring += 1) {
    const r = (radius / rings) * ring;
    ctx.beginPath();
    for (let i = 0; i <= spokes; i += 1) {
      const a = from + step * i;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        // Sag the strand between spokes so it reads as silk, not a polygon.
        const mid = a - step / 2;
        const sag = r * 0.88;
        ctx.quadraticCurveTo(cx + Math.cos(mid) * sag, cy + Math.sin(mid) * sag, x, y);
      }
    }
    ctx.stroke();
  }
}

/** Comic halftone: a soft round cloud of dots, densest at its centre. */
function drawHalftone(cx, cy, radius, color) {
  ctx.save();
  ctx.fillStyle = color;
  for (let i = -radius; i < radius; i += 11) {
    for (let j = -radius; j < radius; j += 11) {
      const d = Math.hypot(i, j) / radius;
      if (d > 1) continue;
      // Deterministic scatter — a redraw on every keystroke must look identical.
      const noise = (Math.abs((i * 73856093) ^ (j * 19349663)) % 1000) / 1000;
      const density = 1 - d;
      if (noise > density) continue;
      ctx.globalAlpha = density * 0.45;
      ctx.beginPath();
      ctx.arc(cx + i, cy + j, 1.9 * density + 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function draw() {
  const { accent, secondary, bg1, bg2 } = state.theme;
  ctx.clearRect(0, 0, W, H);

  // Card background — the suit's own dark tones
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, bg1);
  bg.addColorStop(0.6, bg2);
  bg.addColorStop(1, bg2);
  ctx.fillStyle = bg;
  roundRect(0, 0, W, H, 30);
  ctx.fill();

  ctx.save();
  roundRect(0, 0, W, H, 30);
  ctx.clip();

  // Suit glow top right, webbing glow bottom left
  const glow = ctx.createRadialGradient(W - 100, -40, 20, W - 100, -40, 560);
  glow.addColorStop(0, hexToRgba(accent, 0.42));
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const glow2 = ctx.createRadialGradient(40, H + 40, 20, 40, H + 40, 480);
  glow2.addColorStop(0, hexToRgba(secondary, 0.26));
  glow2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  // Webs in the top-right and bottom-left corners
  drawWeb(W, 0, 430, 5, 9, Math.PI * 0.5, Math.PI, hexToRgba(accent, 0.3));
  drawWeb(0, H, 330, 4, 8, -Math.PI * 0.5, 0, hexToRgba(secondary, 0.26));

  // Halftone wash behind the identity block
  drawHalftone(470, 300, 230, accent);

  // Diagonal speed streaks
  ctx.strokeStyle = hexToRgba(secondary, 0.3);
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i += 1) {
    const y = 150 + i * 26;
    ctx.beginPath();
    ctx.moveTo(W - 300 + i * 14, y);
    ctx.lineTo(W - 120 + i * 14, y - 60);
    ctx.stroke();
  }
  ctx.restore();

  // Comic ink border, doubled
  roundRect(2, 2, W - 4, H - 4, 29);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  ctx.stroke();
  roundRect(12, 12, W - 24, H - 24, 22);
  ctx.strokeStyle = hexToRgba(secondary, 0.5);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // Brand row
  ctx.fillStyle = '#f5f6fa';
  ctx.font = `800 italic 32px ${FONT}`;
  ctx.fillText('COMMIT', 62, 86);
  const brandW = ctx.measureText('COMMIT').width;
  ctx.fillStyle = accent;
  ctx.fillText('-ed', 62 + brandW, 86);

  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(245,246,250,0.65)';
  ctx.font = `700 14px ${MONO}`;
  ctx.fillText('OPEN SOURCE SEASON', W - 62, 84);
  ctx.textAlign = 'left';

  // Avatar
  const cx = 178;
  const cy = 318;
  const r = 96;
  drawAvatar(cx, cy, r);

  // Identity — comic outline on the name
  const left = 320;
  const name = state.name || 'Your Name';
  const size = fitText(name, W - left - 70, 56, '800 italic');
  ctx.font = `800 italic ${size}px ${FONT}`;
  ctx.lineJoin = 'round';
  ctx.lineWidth = 8;
  ctx.strokeStyle = hexToRgba(bg2, 0.92);
  ctx.strokeText(name, left, 300);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(name, left, 300);

  ctx.fillStyle = hexToRgba(secondary, 0.95);
  ctx.font = `600 24px ${MONO}`;
  ctx.fillText(`@${state.username || 'github-handle'}`, left, 344);

  // Role banner — a skewed comic tag rather than a soft pill
  ctx.font = `800 18px ${FONT}`;
  const role = state.role.toUpperCase();
  const tagW = ctx.measureText(role).width + 46;
  ctx.save();
  ctx.translate(left, 372);
  ctx.rotate(-0.035);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(tagW, 0);
  ctx.lineTo(tagW - 12, 42);
  ctx.lineTo(0, 42);
  ctx.closePath();
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.strokeStyle = hexToRgba(bg2, 0.9);
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.fillText(role, 22, 28);
  ctx.restore();

  // Footer
  ctx.strokeStyle = hexToRgba(accent, 0.35);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(62, 496);
  ctx.lineTo(W - 62, 496);
  ctx.stroke();

  ctx.fillStyle = 'rgba(245,246,250,0.5)';
  ctx.font = `600 15px ${MONO}`;
  ctx.fillText('with great commits comes great responsibility', 62, 536);
  ctx.textAlign = 'right';
  ctx.fillStyle = accent;
  ctx.font = `800 16px ${MONO}`;
  ctx.fillText('#COMMITed', W - 62, 536);
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

function applyTheme(button) {
  for (const sw of themeBox.querySelectorAll('.sw')) sw.classList.remove('selected');
  button.classList.add('selected');
  state.theme = {
    accent: button.dataset.accent,
    secondary: button.dataset.secondary,
    bg1: button.dataset.bg1,
    bg2: button.dataset.bg2,
  };
  draw();
}

themeBox.addEventListener('click', (event) => {
  const button = event.target.closest('.sw');
  if (button) applyTheme(button);
});

// Start on whichever chip is marked selected in the markup.
applyTheme(themeBox.querySelector('.sw.selected') || themeBox.querySelector('.sw'));

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
