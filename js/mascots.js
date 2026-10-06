/* bearify · mascotes: o urso (ao lado da marca) e a lamparina (lado direito).
   Sprites do Art, animados a ~10fps: piscar, respirar e balançar no grave. */
window.Mascots = (() => {
  const L = (window.Levels = window.Levels || { bass: 0, mid: 0, treble: 0 });
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ear, heads, body, lamp;
  let blinkAt = 2.5, blinkUntil = 0, glanceAt = 7, glanceUntil = 0, last = 0, hopUntil = 0, seenCurrent = window.CURRENT;

  function init() {
    ear = Art.bearEar().canvas();
    heads = [Art.bearHead(false, false).canvas(), Art.bearHead(true, false).canvas(), Art.bearHead(false, true).canvas()];
    body = Art.bearBody().canvas();
    lamp = Art.lamp().canvas();
  }

  function tick(now) {
    if (FX.iso.all || FX.isMobile()) return;
    const gap = FX.low ? 260 : (reduce ? 500 : 110);
    const t = now / 1000, secs = t;
    if (now - last < gap) return;
    last = now;
    if (secs > blinkAt) { blinkUntil = secs + 0.15; blinkAt = secs + 2.4 + Math.random() * 3.4; }
    if (secs > glanceAt) { glanceUntil = secs + 1.2; glanceAt = secs + 6 + Math.random() * 6; }
    if (window.CURRENT !== seenCurrent) { seenCurrent = window.CURRENT; hopUntil = secs + 0.45; }
    drawBear(secs);
    drawLamp(t);
  }

  // urso ~50x56: corpo embaixo, cabeça com fones por cima
  function drawBear(secs) {
    for (const id of ['mascotBear', 'bootBear']) {
      const c = document.getElementById(id);
      if (c) paintBear(c, secs);
    }
  }
  function paintBear(c, secs) {
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    const bob = !reduce && L.bass > 0.42 ? 1 : 0;
    const hop = !reduce && secs < hopUntil ? 2 : 0;
    const hi = secs < blinkUntil ? 1 : secs < glanceUntil ? 2 : 0;
    g.drawImage(body, 6, 32 - bob - hop);
    g.drawImage(ear, 3, 3 - bob - hop);
    g.drawImage(ear, 33, 3 - bob - hop);
    g.drawImage(heads[hi], 0, 0 - bob - hop);
  }

  // lamparina com núcleo que pulsa no agudo
  function drawLamp(t) {
    const c = document.getElementById('mascotLamp');
    if (!c) return;
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    g.drawImage(lamp, 0, 0);
    const live = document.body.classList.contains('playing');
    const k = reduce ? 0.5 : live ? 0.35 + L.treble * 0.5 + Math.sin(t * 9) * 0.06 : 0.45;
    g.fillStyle = `rgba(255,200,110,${Math.max(0.15, Math.min(0.75, k)).toFixed(2)})`;
    g.fillRect(7, 13, 6, 4);
    g.fillStyle = '#ffe9b8';
    g.fillRect(9, 14, 3, 2);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  FX.add('mascots', tick, 30);
  // hover na marca: o urso olha
  document.addEventListener('pointerover', (e) => { if (e.target.closest && e.target.closest('.brand')) glanceUntil = performance.now() / 1000 + 1.2; });
  return {};
})();
