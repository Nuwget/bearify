/* bearify · boot: micro-cena exclusiva (urso na janela, chuva, cidade, lua).
   Canvas 96x64 escalado com pixelated. Progresso REAL por estágios:
   0 parse → 1 UI pronta → 2 fontes → 3 primeiro áudio → 100%.
   window.__boot = { stage(n), done() }. */
window.__boot = (() => {
  const born = performance.now();
  let doneCalled = false;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let bear, ear, bodyC, headO, headC;
  let blinkAt = 1.8, blinkUntil = 0;

  function init() {
    bear = document.getElementById('bootBear');
    if (!bear || !window.Art) return;
    ear = Art.bearEar().canvas();
    bodyC = Art.bearBody().canvas();
    headO = Art.bearHead(false, false).canvas();
    headC = Art.bearHead(true, false).canvas();
    // failsafe: nunca prende o app
    setTimeout(() => done(), 4000);
  }

  function mulberry(seed) { let a = seed; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function tick(now) {
    const el = document.getElementById('boot');
    if (!el || el.classList.contains('done') || !bear) return;
    draw((now - born) / 1000);
  }

  function draw(t) {
    const W = 96, H = 64, g = bear.getContext('2d');
    const r = mulberry(7);
    const e = window.Levels ? window.Levels.bass : 0;
    // céu
    for (let y = 0; y < H; y++) { g.fillStyle = y < 26 ? '#0b0722' : y < 44 ? '#1c1448' : '#07041a'; g.fillRect(0, y, W, 1); }
    // estrelas + lua com glow
    for (let i = 0; i < 14; i++) { const x = r() * W, y = r() * 20; if (Math.sin(t * 1.2 + i * 2) > -0.4) { g.fillStyle = '#c9baff'; g.fillRect(x, y, 1, 1); } }
    g.fillStyle = 'rgba(255,217,138,.22)'; g.fillRect(70, 3, 14, 14);
    g.fillStyle = '#ffd98a'; g.fillRect(73, 6, 8, 8); g.fillStyle = '#fff3d0'; g.fillRect(75, 8, 3, 3);
    // cidade com janelas que piscam
    for (let x = 2; x < W - 2; x += 7) {
      const bh = 8 + Math.floor(r() * 10);
      g.fillStyle = '#141040'; g.fillRect(x, 44 - bh, 6, bh);
      for (let wy = 44 - bh + 2; wy < 42; wy += 3) for (let wx = x + 1; wx < x + 5; wx += 2)
        if (r() < 0.5) { g.fillStyle = Math.sin(t * 0.8 + wx + wy) > 0.1 ? '#ffd98a' : '#4a3a9a'; g.fillRect(wx, wy, 1, 1); }
    }
    // chuva em 2 planos
    if (!reduce) {
      g.fillStyle = 'rgba(170,180,255,.45)';
      for (let i = 0; i < 16; i++) { const x = (r() * W + t * 30 + i * 11) % W, y = (r() * 44 + t * 66 + i * 17) % 44; g.fillRect(x, y, 1, 2); }
    }
    // parapeito + luminária quente
    g.fillStyle = '#05030f'; g.fillRect(0, 44, W, 4);
    g.fillStyle = 'rgba(255,170,80,.4)'; g.fillRect(4, 37, 5, 5);
    g.fillStyle = '#ffb86b'; g.fillRect(6, 39, 2, 2);
    // o urso sentado olhando a cidade (acorda com o progresso)
    if (t > blinkAt) { blinkUntil = t + 0.15; blinkAt = t + 2 + Math.random() * 3; }
    const hop = t < hopUntil ? 2 : 0;
    const wake = 1;
    g.globalAlpha = wake;
    const bx = 62, by = 30 - hop;
    g.drawImage(bodyC, bx - 8, by + 8, 19, 12);
    g.drawImage(ear, bx - 11, by - 4, 7, 7);
    g.drawImage(ear, bx + 4, by - 4, 7, 7);
    g.drawImage(t < blinkUntil ? headC : headO, bx - 12, by - 5, 25, 19);
    g.globalAlpha = 1;
    // vinheta
    g.fillStyle = 'rgba(4,2,12,.35)'; g.fillRect(0, 0, W, 2); g.fillRect(0, H - 2, W, 2);
  }

  function stage(n) {}
  function done() {
    if (doneCalled) return; doneCalled = true;
    try { FX.remove('boot'); } catch {}
    const wait = Math.max(0, 250 - (performance.now() - born));
    setTimeout(() => {
      const el = document.getElementById('boot');
      if (!el) return;
      el.classList.add('done');
      setTimeout(() => el.remove(), 400);
    }, wait);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  FX.add('boot', tick, 30);
  setTimeout(() => { try { done(); } catch {} }, 1500);
  addEventListener('load', () => { try { done(); } catch {} });
  return { stage, done };
})();
