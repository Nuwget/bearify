/* Capas pixeladas animadas, uma por faixa, baseadas no título/clima da música. */
window.Covers = (() => {
  const PELETS = {
    past: ['#0b0722', '#241a62', '#5b3bb0', '#b062b6', '#ffd98a'],
    blue: ['#030b2e', '#0a2a6b', '#1e5aa8', '#4aa3df', '#bcd9ff'],
    time: ['#2a0f2e', '#7b2d4e', '#c8553d', '#f0923a', '#ffd27a'],
    silent: ['#05060f', '#101226', '#272248', '#473d6e', '#8f7fe0'],
  };

  function rng(seed) { let a = seed | 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // noite na janela com lua e chuva
  function past(g, n, t, seed) {
    const r = rng(seed); const P = PELETS.past;
    for (let y = 0; y < n; y++) { const c = P[Math.min(2, Math.floor(y / (n / 3)))]; g.fillStyle = c; g.fillRect(0, y, n, 1); }
    g.fillStyle = P[4]; g.beginPath(); g.arc(n * 0.72, n * 0.24, n * 0.12, 0, 7); g.fill();
    g.fillStyle = '#1a1440';
    for (let i = 0, x = 0; x < n; x += 4 + Math.floor(r() * 4)) g.fillRect(x, n - 6 - Math.floor(r() * 6), 4, n);
    g.strokeStyle = 'rgba(180,200,255,.55)'; g.lineWidth = 1;
    for (let i = 0; i < 6; i++) { const x = (r() * n + t * 40 + i * 9) % n, y = (t * 60 + i * 13) % n; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 2, y + 4); g.stroke(); }
  }

  // mar azul, ondas se mexendo
  function blue(g, n, t, seed) {
    const r = rng(seed); const P = PELETS.blue;
    for (let y = 0; y < n; y++) g.fillStyle = P[Math.min(P.length - 1, Math.floor(y / (n * 0.5)) + 1)];
    for (let y = 0; y < n; y++) { g.fillStyle = y < n / 2 ? (y < n / 5 ? P[0] : P[1]) : P[2]; g.fillRect(0, y, n, 1); }
    for (let i = 0; i < 3; i++) {
      const y = n * 0.55 + i * 4 + Math.sin(t * 1.6 + i) * 1.5;
      g.fillStyle = P[3 - (i % 2)];
      for (let x = 0; x < n; x += 4) g.fillRect(x + Math.sin(t * 2 + x * 0.4 + i) * 2, y, 3, 1);
    }
    g.fillStyle = P[4]; g.fillRect(n * 0.3 + Math.sin(t) * 2, n * 0.18, 3, 3);
    for (let i = 0; i < 5; i++) { const x = r() * n, y = (r() * n * 0.4 + t * 8) % (n * 0.4); g.fillRect(x, y, 1, 1); }
  }

  // relógio dourado no pôr do sol
  function time(g, n, t, seed) {
    const P = PELETS.time;
    for (let y = 0; y < n; y++) g.fillStyle = P[Math.min(2, Math.floor(y / (n / 2.4)))], g.fillRect(0, y, n, 1);
    const cx = n / 2, cy = n * 0.52, R = n * 0.3;
    g.fillStyle = P[4]; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
    g.fillStyle = P[0]; g.beginPath(); g.arc(cx, cy, R - 2, 0, 7); g.fill();
    g.strokeStyle = P[4]; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(t * 0.5) * (R - 5), cy + Math.sin(t * 0.5) * (R - 5)); g.stroke();
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(t * 2) * (R - 7) * 0.7, cy + Math.sin(t * 2) * (R - 7) * 0.7); g.stroke();
    g.fillStyle = P[4]; g.fillRect(cx - 1, cy - 1, 2, 2);
  }

  // silêncio: escuro, uma estrela pulsando, ondas fracas
  function silent(g, n, t, seed) {
    const P = PELETS.silent;
    g.fillStyle = P[0]; g.fillRect(0, 0, n, n);
    const k = (Math.sin(t * 1.4) + 1) / 2;
    g.fillStyle = P[4]; g.globalAlpha = 0.4 + k * 0.6; g.fillRect(n * 0.5 - 1, n * 0.45 - 1, 3, 3); g.globalAlpha = 1;
    g.fillStyle = P[2];
    for (let i = 0; i < 3; i++) {
      const a = 0.5 + Math.sin(t * 1.4 - i * 0.9) * 0.4; if (a > 0.1) { g.globalAlpha = a * 0.4; g.strokeStyle = P[3]; g.beginPath(); g.arc(n / 2, n * 0.45, 5 + i * 4, 0, 7); g.stroke(); }
    }
    g.globalAlpha = 1;
  }

  const THEMES = [null, past, blue, time, silent];
  const KEYWORD = [
    (title) => 'past',                                    // Welcome to your past → janela/chuva
    (title) => /blue/i.test(title) ? 'blue' : null,
    (title) => /time|little/i.test(title) ? 'time' : null,
    (title) => /silent|rem/i.test(title) ? 'silent' : null,
  ];

  function themeOf(track, i) {
    if (i === 0) return past;
    const t = (track.title + ' ' + track.album).toLowerCase();
    if (t.includes('blue')) return blue;
    if (t.includes('time') || t.includes('little')) return time;
    if (t.includes('silent') || t.includes('rem')) return silent;
    return [past, blue, time, silent][i % 4];
  }

  function draw(c, track, i, t) {
    if (!c) return;
    const n = 32; if (c.width !== n) { c.width = n; c.height = n; }
    const g = c.getContext('2d');
    themeOf(track, i)(g, n, t, 1000 + i * 77);
  }

  // anima todas as canvases com a classe .cov (miniaturas) e a capa do player (#coverCanvas)
  function currentTrack() { return window.TRACKS && window.TRACKS[Math.max(0, window.CURRENT || 0)] ? window.CURRENT : 0; }
  function tick(now) {
    const t = now / 1000;
    document.querySelectorAll('canvas.cov').forEach((c) => draw(c, window.TRACKS[+c.dataset.i || 0] || {}, +c.dataset.i || 0, t));
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  return { draw, themeOf };
})();
