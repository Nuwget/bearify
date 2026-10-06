/* bearify · FX scheduler único: target 60fps com degradação automática.
   Todos os loops visuais se registram aqui — UM rAF mestre despacha.
   - FX.add(name, fn, fps) · FX.remove(name)
   - perf: full | balanced | battery (localStorage bearify.perf; mobile default balanced)
   - flags de isolamento: ?scene=off ?covers=off ?fx=off ?blur=off ?noviz
   - ?debug=1 (ou #dbg): overlay com FPS, loops, canvas, analyser
   Loops leem FX.paused / FX.low. Nenhum loop roda com aba oculta. */
window.FX = (() => {
  const q = location.search + ' ' + location.hash;
  const has = (k) => new RegExp('[?#&]' + k + '(=1|\\b)').test(q);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mq = matchMedia('(max-width: 860px)');
  const mobile = mq.matches;
  const stored = (() => { try { return localStorage.getItem('bearify.perf'); } catch { return null; } })();
  const perf = stored || (mobile ? 'balanced' : 'full');

  const FX = {
    paused: document.hidden, low: reduce, fps: 60, ms: 16.7, loops: 0,
    perf, mobile, reduce, mq,
    isMobile: () => mq.matches, // ao vivo: o site troca de layout ao girar o aparelho
    iso: { scene: /[?#&]scene=off\b/.test(q), covers: /[?#&]covers=off\b/.test(q), all: /[?#&](fx|effects)=off\b/.test(q), blur: /[?#&]blur=off\b/.test(q), noviz: /[?#&]noviz\b/.test(q) },
  };
  const subs = new Map(); // name -> {fn, fps, acc, last}
  let last = performance.now(), ema = 16.7, lowSince = 0, rafId = 0;

  FX.add = (name, fn, fps) => { subs.set(name, { fn, fps, acc: 1, last: 0 }); FX.loops = subs.size; };
  FX.remove = (name) => { subs.delete(name); FX.loops = subs.size; };
  FX.setPerf = (p) => {
    FX.perf = p;
    try { localStorage.setItem('bearify.perf', p); } catch {}
    applyPerf();
    if (window.UI && UI.toast) UI.toast('Performance: ' + p);
  };
  function applyPerf() {
    const low = FX.perf !== 'full' || reduce;
    FX.low = low;
    document.body.classList.toggle('lowfx', low);
    document.body.classList.toggle('battery', FX.perf === 'battery');
  }

  document.addEventListener('visibilitychange', () => {
    FX.paused = document.hidden;
    document.body.classList.toggle('hidden-tab', document.hidden);
  });

  const DBG = has('debug=1') || has('dbg');
  let dbgEl = null;
  if (DBG) {
    dbgEl = document.createElement('div');
    dbgEl.id = 'fxdbg';
    document.addEventListener('DOMContentLoaded', () => document.body.appendChild(dbgEl));
  }

  function frame(now) {
    rafId = requestAnimationFrame(frame);
    const dt = now - last; last = now;
    ema = ema * 0.95 + Math.min(100, dt) * 0.05;
    FX.fps = 1000 / Math.max(1, ema); FX.ms = ema;
    if (FX.paused) return; // aba oculta: zero trabalho
    if (!reduce && !FX.low && FX.perf === 'full' && ema > 24) {
      if (!lowSince) lowSince = now;
      if (now - lowSince > 2500) { FX.low = true; document.body.classList.add('lowfx'); }
    } else if (ema < 20) lowSince = 0;
    for (const [name, s] of subs) {
      const want = FX.perf === 'battery' && (name === 'scene' || name === 'covers') ? Math.min(s.fps, 2) : s.fps;
      s.acc += dt / (1000 / want);
      if (s.acc >= 1) { s.acc = s.acc % 1; s.fn(now, dt); }
    }
    if (dbgEl && (FX.frames = (FX.frames || 0) + 1) % 10 === 0) {
      const cv = document.getElementById('scene');
      dbgEl.textContent = `FPS ${FX.fps.toFixed(0)} · ${FX.ms.toFixed(1)}ms · RAF ${subs.size} · ${FX.perf.toUpperCase()}${FX.low ? '+LOW' : ''} · canvas ${cv ? cv.width + 'x' + cv.height : '-'} · viz ${window.__vizOn ? 'ON' : 'OFF'}`;
    }
  }

  mq.addEventListener('change', () => {
    document.body.classList.toggle('is-mobile', mq.matches);
    if (window.UI) UI.route();
    if (window.Mobile) Mobile.route();
  });
  document.body.classList.toggle('is-mobile', mq.matches);
  applyPerf();
  if (FX.iso.blur) document.body.classList.add('noblur');
  if (FX.iso.scene) { const c = document.getElementById('scene'); if (c) c.style.display = 'none'; }
  rafId = requestAnimationFrame(frame);
  return FX;
})();
