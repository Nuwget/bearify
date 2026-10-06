/* bearify · capas pixeladas vivas. Cada faixa/playlist tem sua PRÓPRIA cena
   (mesmo universo, composições diferentes). 32px, só fillRect — sem blur.
   O tempo avança com o playback (congela suave no pause) e a energia do
   grave (window.Levels) alimenta glows. Respeita prefers-reduced-motion. */
window.Covers = (() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function rng(seed) { let a = seed | 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const L = () => window.Levels || { bass: 0, mid: 0, treble: 0 };
  const E = () => (document.body.classList.contains('playing') ? L().bass : 0);

  // fonte 3x5 p/ o relógio digital
  const FONT = {
    '0': ['111', '101', '101', '101', '111'], '3': ['111', '001', '111', '001', '111'],
    '4': ['101', '101', '111', '001', '001'], '7': ['111', '001', '010', '010', '010'],
    ':': ['0', '1', '0', '1', '0'],
  };
  function text(g, str, x, y, c) {
    g.fillStyle = c; let cx = x;
    for (const ch of str) {
      const gl = FONT[ch] || ['0', '0', '0', '0', '0'];
      gl.forEach((row, j) => [...row].forEach((v, i) => { if (v === '1') g.fillRect(cx + i, y + j, 1, 1); }));
      cx += (gl[0].length) + 1;
    }
  }

  function sky(g, n, stops) {
    for (let y = 0; y < n; y++) { g.fillStyle = stops[Math.min(stops.length - 1, Math.floor((y / n) * stops.length))]; g.fillRect(0, y, n, 1); }
  }
  function rain(g, n, t, r, count, color, speed) {
    g.fillStyle = color;
    for (let i = 0; i < count; i++) {
      const x = (r() * n + t * speed + i * 7) % n, y = (r() * n + t * speed * 2.2 + i * 13) % n;
      g.fillRect(x, y, 1, 2);
    }
  }

  /* -------- WELCOME: janela de quarto, chuva, luminária, foto antiga -------- */
  function past(g, n, t, seed) {
    const r = rng(seed), e = E();
    sky(g, n, ['#0b0722', '#1c1448', '#3a2a80']);
    // lua com glow que respira no grave
    const gr = 3 + Math.round(e * 3);
    g.fillStyle = 'rgba(255,217,138,.25)'; g.fillRect(22 - gr, 2 - gr, 8 + gr * 2, 8 + gr * 2);
    g.fillStyle = '#ffd98a'; g.fillRect(23, 3, 6, 6); g.fillStyle = '#fff3d0'; g.fillRect(24, 4, 2, 2);
    // cidade desfocada: blocos + janelas que piscam devagar
    for (let i = 0, x = 0; x < n; x += 4 + Math.floor(r() * 4)) {
      const bh = 5 + Math.floor(r() * 6);
      g.fillStyle = '#141040'; g.fillRect(x, n - 8 - bh, 4, bh + 8);
      if (r() < 0.75) { g.fillStyle = Math.sin(t * 0.9 + x * 2) > 0.2 ? '#ffd98a' : '#5a4a9a'; g.fillRect(x + 1, n - 8 - bh + 2, 1, 1); }
    }
    rain(g, n, t, rng(seed + 9), 7, 'rgba(190,200,255,.6)', 26);
    // parapeito + luminária que pulsa + foto antiga
    g.fillStyle = '#07041a'; g.fillRect(0, n - 5, n, 5);
    g.fillStyle = `rgba(255,170,80,${0.3 + e * 0.3})`; g.fillRect(1, n - 11, 4, 4);
    g.fillStyle = '#ffb86b'; g.fillRect(2, n - 10, 2, 2);
    g.fillStyle = '#c9baff'; g.fillRect(24, n - 9, 5, 4); g.fillStyle = '#241a5e'; g.fillRect(25, n - 8, 3, 2);
  }

  /* -------- BLUE: escotilha p/ o oceano -------- */
  function blue(g, n, t, seed) {
    const r = rng(seed), e = E();
    sky(g, n, ['#02081e', '#0a2a6b', '#0a2a6b']);
    for (let i = 0; i < 4; i++) { const x = r() * n, y = (r() * n * 0.5 + t * 6) % (n * 0.55); g.fillStyle = 'rgba(188,217,255,.7)'; g.fillRect(x, y, 1, 1); }
    // escotilha de latão
    const cx = n / 2, cy = n * 0.56, R = n * 0.32;
    g.fillStyle = '#8a6a2a'; g.beginPath(); g.arc(cx, cy, R + 2, 0, 7); g.fill();
    g.fillStyle = '#061a3d'; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
    // ondas em 2 camadas dentro da escotilha
    for (let layer = 0; layer < 2; layer++) {
      g.fillStyle = layer ? '#4aa3df' : '#1e5aa8';
      for (let x = 0; x < n; x++) {
        const y = cy - 2 + layer * 4 + Math.sin(x * 0.45 + t * (1.4 + layer) + layer * 2) * 2;
        if (Math.hypot(x - cx, y - cy) < R - 1) g.fillRect(x, y, 2, 1);
      }
    }
    // reflexo que oscila + brilho que pulsa no grave
    g.fillStyle = `rgba(188,217,255,${0.35 + e * 0.4})`;
    const rx = cx + Math.sin(t * 0.8) * 3;
    for (let y = 0; y < 6; y++) g.fillRect(rx - 1 + (y % 2), cy + 2 + y, 2, 1);
  }

  /* -------- TIME: quarto do relógio (cena completa) -------- */
  function time(g, n, t, seed) {
    const e = E();
    sky(g, n, ['#2a0f2e', '#5c1f42', '#5c1f42']);
    // janela com lua e chuva à direita
    g.fillStyle = '#170a24'; g.fillRect(21, 2, 10, 11);
    g.fillStyle = '#0d1440'; g.fillRect(22, 3, 8, 9);
    g.fillStyle = 'rgba(255,240,200,.28)'; g.fillRect(25, 4, 5, 5);
    g.fillStyle = '#ffedb8'; g.fillRect(26, 5, 3, 3);
    const rr = rng(seed + 31);
    for (let i = 0; i < 4; i++) { const x = 22 + rr() * 8, y = 3 + ((rr() * 9 + t * 22) % 9); g.fillStyle = 'rgba(170,180,255,.6)'; g.fillRect(x, y, 1, 2); }
    g.fillStyle = '#170a24'; g.fillRect(25, 3, 1, 9); g.fillRect(22, 7, 8, 1);
    // feixe quente da janela + poeira
    g.fillStyle = `rgba(255,210,122,${0.13 + e * 0.1})`;
    for (let i = 0; i < 10; i++) g.fillRect(19 + i, 12 + Math.round(i * 0.8), 2, 1);
    const r = rng(seed);
    for (let i = 0; i < 4; i++) { const x = 18 + r() * 10, y = 12 + ((r() * 10 + t * 5) % 10); g.fillStyle = '#ffd27a'; g.fillRect(x, y, 1, 1); }
    // relógio: ponteiros andam de verdade, quase meia-noite
    const cx = 10, cy = 13, R = 8;
    g.fillStyle = `rgba(255,217,138,${0.22 + e * 0.2})`; g.beginPath(); g.arc(cx, cy, R + 2, 0, 7); g.fill();
    g.fillStyle = '#ffd98a'; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
    g.fillStyle = '#2a0f2e'; g.beginPath(); g.arc(cx, cy, R - 2, 0, 7); g.fill();
    g.fillStyle = '#ffd98a';
    for (let k = 0; k < 12; k++) { const a = (k / 12) * 6.28; g.fillRect(Math.round(cx + Math.cos(a) * (R - 3)), Math.round(cy + Math.sin(a) * (R - 3)), 1, 1); }
    const hand = (ang, len, c) => { g.strokeStyle = c; g.lineWidth = 1; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ang) * len, cy + Math.sin(ang) * len); g.stroke(); };
    hand(-Math.PI / 2 + (t * 0.05) % 6.28, R - 4, '#ffd98a');
    hand(-Math.PI / 2 + (t * 0.5) % 6.28, R - 3, '#ffe9b8');
    hand(t * 2, R - 3, '#f06a5a');
    g.fillStyle = '#ffd98a'; g.fillRect(cx - 1, cy - 1, 2, 2);
    // prateleira com livros + mesa com papéis
    g.fillStyle = '#170a24'; g.fillRect(1, 22, 12, 1);
    const cols = ['#b062b6', '#4aa3df', '#c0395a'];
    cols.forEach((c, i) => { g.fillStyle = c; g.fillRect(2 + i * 3, 18 + (i === 1 ? 1 : 0), 2, 4 - (i === 1 ? 1 : 0)); });
    g.fillStyle = '#07041a'; g.fillRect(0, n - 5, n, 5);
    g.fillStyle = '#d9d3f2'; g.fillRect(3, n - 4, 6, 3); g.fillStyle = '#7b2d4e'; g.fillRect(4, n - 3, 4, 1);
    g.fillStyle = '#b8a0f2'; g.fillRect(11, n - 4, 5, 3);
  }

  /* -------- SILENT: toca-discos sozinho -------- */
  function silent(g, n, t, seed) {
    const r = rng(seed), e = E();
    g.fillStyle = '#05060f'; g.fillRect(0, 0, n, n);
    // faixa de luz com poeira à deriva
    g.fillStyle = `rgba(143,127,224,${0.12 + e * 0.1 + (Math.sin(t * 7) > 0.96 ? 0.06 : 0)})`;
    for (let i = 0; i < 14; i++) g.fillRect(16 + i, 4 + i, 2, 1);
    for (let i = 0; i < 5; i++) { const x = 16 + r() * 12, y = (r() * 20 + t * 4) % 26; g.fillStyle = '#8f7fe0'; g.fillRect(x, y, 1, 1); }
    // toca-discos + vinil girando (o brilho orbita)
    g.fillStyle = '#101226'; g.fillRect(4, 14, 24, 14);
    const cx = 13, cy = 21, R = 8;
    g.fillStyle = '#000'; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
    g.strokeStyle = '#272248'; g.beginPath(); g.arc(cx, cy, R - 2, 0, 7); g.stroke();
    const a = t * 1.8;
    g.fillStyle = '#8f7fe0'; g.fillRect(Math.round(cx + Math.cos(a) * 5), Math.round(cy + Math.sin(a) * 5), 2, 2);
    g.fillStyle = '#b062b6'; g.beginPath(); g.arc(cx, cy, 2, 0, 7); g.fill();
    // agulha quase parada
    g.strokeStyle = '#473d6e'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(26, 15); g.lineTo(19 + Math.sin(t * 0.4) * 0.8, 22); g.stroke();
    // janela vazia ao fundo
    g.fillStyle = '#101226'; g.fillRect(2, 2, 8, 8); g.fillStyle = '#1c1838'; g.fillRect(3, 3, 6, 6);
  }

  /* -------- MADRUGADA: mesa 03:47 -------- */
  function madrugada(g, n, t, seed) {
    const r = rng(seed), e = E();
    sky(g, n, ['#070418', '#141040', '#241a5e']);
    // cidade distante + chuva na janela
    for (let i = 0; i < 8; i++) { const x = r() * n, y = r() * 12; g.fillStyle = Math.sin(t + i * 2) > 0 ? '#8f84e0' : '#3a2a80'; g.fillRect(x, y, 1, 1); }
    rain(g, n, t, rng(seed + 4), 4, 'rgba(160,170,255,.5)', 20);
    // notebook com cursor piscando + tela que oscila
    g.fillStyle = '#0a0828'; g.fillRect(3, 14, 14, 10);
    g.fillStyle = `rgba(90,220,255,${0.75 + Math.sin(t * 3) * 0.1 + e * 0.15})`; g.fillRect(4, 15, 12, 8);
    g.fillStyle = '#0a2a3d'; g.fillRect(5, 16, 7, 1); g.fillRect(5, 18, 9, 1); g.fillRect(5, 20, 5, 1);
    if (Math.sin(t * 4) > -0.2) { g.fillStyle = '#e8fbff'; g.fillRect(13, 20, 1, 1); }
    g.fillStyle = '#0a0828'; g.fillRect(2, 24, 16, 1);
    // relógio digital 03:47
    text(g, '03:47', 19, 15, Math.sin(t * 2) > -0.9 ? '#5adcff' : '#1e5aa8');
    // copo com vapor + fone
    g.fillStyle = '#3a2a80'; g.fillRect(21, 22, 3, 4);
    g.fillStyle = 'rgba(220,220,255,.5)'; g.fillRect(21 + Math.round(Math.sin(t * 2) * 1), 19 - (Math.floor(t * 2) % 3), 1, 1);
    g.fillStyle = '#b062b6'; g.fillRect(26, 22, 4, 1); g.fillRect(26, 22, 1, 3); g.fillRect(29, 22, 1, 3);
    // mesa
    g.fillStyle = '#07041a'; g.fillRect(0, n - 5, n, 5);
  }

  /* -------- MARÉ: farol, píer e reflexo -------- */
  function mare(g, n, t, seed) {
    const e = E();
    sky(g, n, ['#0a1030', '#1e3a8a', '#1e3a8a']);
    g.fillStyle = '#e8ecff'; g.fillRect(6, 4, 3, 3);
    // mar + ondas em movimento + espuma
    for (let y = 16; y < n; y++) { g.fillStyle = y < 22 ? '#1e5aa8' : '#0a2a6b'; g.fillRect(0, y, n, 1); }
    for (let i = 0; i < 3; i++) {
      const y = 18 + i * 4;
      g.fillStyle = i === 1 ? '#4aa3df' : '#2a7ac0';
      for (let x = 0; x < n; x += 3) {
        const xx = x + Math.round(Math.sin(t * 1.8 + x * 0.5 + i * 2) * 2);
        g.fillRect(xx, y, 2, 1);
        if (i === 2 && (x + Math.floor(t * 2)) % 9 === 0) { g.fillStyle = '#bcd9ff'; g.fillRect(xx, y - 1, 1, 1); g.fillStyle = '#2a7ac0'; }
      }
    }
    // reflexo da lua que oscila
    g.fillStyle = `rgba(232,236,255,${0.4 + e * 0.3})`;
    const rx = 6 + Math.round(Math.sin(t) * 1.5);
    for (let y = 17; y < 27; y += 2) g.fillRect(rx, y, 2, 1);
    // píer à esquerda
    g.fillStyle = '#05060f';
    for (let x = 0; x < 9; x += 3) g.fillRect(x, 15, 2, 12);
    g.fillRect(0, 14, 10, 2);
    // farol à direita com feixe girando
    g.fillStyle = '#e8ecff'; g.fillRect(25, 6, 4, 10);
    g.fillStyle = '#c0392b'; g.fillRect(25, 8, 4, 2); g.fillRect(25, 12, 4, 2);
    g.fillStyle = '#05060f'; g.fillRect(24, 4, 6, 2);
    const on = Math.sin(t * 1.2) > 0;
    g.fillStyle = on ? `rgba(255,240,180,${0.5 + e * 0.3})` : 'rgba(255,240,180,.12)';
    for (let i = 0; i < 8; i++) g.fillRect(24 - i * 2, 6 + Math.round(i * 0.7), 2, 1);
    g.fillStyle = '#fff3d0'; g.fillRect(26, 4, 2, 1);
  }

  /* -------- COLLAGE: a coleção completa -------- */
  function collage(g, n, t, seed) {
    const h = n / 2;
    g.fillStyle = '#1c1448'; g.fillRect(0, 0, h, h);
    g.fillStyle = '#ffd98a'; g.fillRect(4, 3, 4, 4);
    g.fillStyle = '#241a5e'; g.fillRect(1, h - 5, 6, 5); g.fillRect(9, h - 6, 5, 6);
    g.fillStyle = '#0a2a6b'; g.fillRect(h, 0, n - h, h);
    g.fillStyle = '#4aa3df';
    for (let x = 0; x < 5; x++) g.fillRect(h + 1 + x * 3, 6 + Math.round(Math.sin(t * 2 + x) * 2), 2, 1);
    g.fillStyle = '#7b2d4e'; g.fillRect(0, h, h, n - h);
    g.fillStyle = '#ffd98a'; g.beginPath(); g.arc(h / 2, h + h / 2, 5, 0, 7); g.fill();
    g.fillStyle = '#2a0f2e'; g.beginPath(); g.arc(h / 2, h + h / 2, 3, 0, 7); g.fill();
    g.strokeStyle = '#ffd98a'; g.beginPath(); g.moveTo(h / 2, h + h / 2); g.lineTo(h / 2 + Math.cos(t * 2) * 2, h + h / 2 + Math.sin(t * 2) * 2); g.stroke();
    g.fillStyle = '#05060f'; g.fillRect(h, h, n - h, n - h);
    g.fillStyle = '#000'; g.beginPath(); g.arc(h + h / 2, h + h / 2, 5, 0, 7); g.fill();
    const a = t * 1.8;
    g.fillStyle = '#8f7fe0'; g.fillRect(Math.round(h + h / 2 + Math.cos(a) * 3), Math.round(h + h / 2 + Math.sin(a) * 3), 1, 1);
    g.fillStyle = '#1c1448'; g.fillRect(0, h - 1, n, 2); g.fillRect(h - 1, 0, 2, n);
  }

  /* -------- RESUME: continue ouvindo -------- */
  function resume(g, n, t, seed) {
    const live = document.body.classList.contains('playing');
    g.fillStyle = '#0d0a24'; g.fillRect(0, 0, n, n);
    const p = (t * 0.12) % 1;
    const s = live ? 1 + Math.sin(t * 5) * 0.04 : 1;
    const w = 12 * s, h = 12 * s, x0 = (n - w) / 2, y0 = (n - h) / 2 - 2;
    g.fillStyle = '#1ed760';
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0, y0 + h); g.lineTo(x0 + w, y0 + h / 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(4, n - 8, n - 8, 2);
    g.fillStyle = '#1ed760'; g.fillRect(4, n - 8, (n - 8) * p, 2);
    g.fillStyle = '#fff'; g.fillRect(4 + (n - 8) * p - 1, n - 9, 2, 4);
  }

  /* -------- HEART: liked songs -------- */
  function heart(g, n, t, seed) {
    const live = document.body.classList.contains('playing');
    g.fillStyle = '#1c0a20'; g.fillRect(0, 0, n, n);
    const beat = live ? (Math.sin(t * 4) > 0.55 ? 1 : 0) : 0;
    const P = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
    const k = beat ? 3 : 2.6, ox = Math.round((n - 7 * k) / 2), oy = Math.round((n - 7 * k) / 2) - 1;
    g.fillStyle = beat ? '#ff5a7a' : '#c0395a';
    P.forEach((row, j) => [...row].forEach((v, i) => { if (v === 'X') g.fillRect(Math.round(ox + i * k), Math.round(oy + j * k), Math.ceil(k), Math.ceil(k)); }));
    const r = rng(seed);
    for (let i = 0; i < 3; i++) { const x = r() * n, y = (r() * n + t * 8) % n; g.fillStyle = 'rgba(255,150,180,.6)'; g.fillRect(x, y, 1, 1); }
  }

  const THEMES = { past, blue, time, silent, madrugada, mare, collage, resume, heart };

  function themeFor(track, i) {
    const t = ((track && track.title) || '').toLowerCase();
    if (t.includes('blue')) return 'blue';
    if (t.includes('time') || t.includes('little')) return 'time';
    if (t.includes('silent') || t.includes('rem')) return 'silent';
    return ['past', 'blue', 'time', 'silent'][i % 4];
  }

  function draw(c, track, i, t) {
    if (!c) return;
    const n = 32; if (c.width !== n) { c.width = n; c.height = n; }
    const g = c.getContext('2d');
    const key = (c.dataset && c.dataset.theme && THEMES[c.dataset.theme]) ? c.dataset.theme : themeFor(track, i);
    g.clearRect(0, 0, n, n);
    THEMES[key](g, n, t, 1000 + i * 77 + key.length * 13);
  }

  // tempo próprio: avança com o playback, quase congela no pause
  let ta = 0, lastT = 0;
  let cFrame = 0;
  function tick(now) {
    if (window.FX && FX.paused) { requestAnimationFrame(tick); return; }
    const lowFx = window.FX && FX.low;
    if (lowFx && ((cFrame++ % 3) !== 0)) { requestAnimationFrame(tick); return; }
    const t = now / 1000, dt = Math.min(0.1, t - (lastT || t));
    lastT = t;
    if (!reduce) ta += dt * (document.body.classList.contains('playing') ? 1 : 0.06);
    document.querySelectorAll('canvas.cov').forEach((c) => draw(c, window.TRACKS[+c.dataset.i || 0] || {}, +c.dataset.i || 0, ta));
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  return { draw, themeFor, THEMES };
})();
