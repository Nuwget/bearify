/* bearify · FX scheduler: target 60fps com degradação automática.
   - window.FX = { paused, low, fps, ms, frames } (objeto vivo, lido por referência)
   - pausa trabalho visual com aba oculta (visibilitychange)
   - mobile começa reduzido; FPS baixo sustentado degrada sozinho
   - ?debug=1 (ou #dbg) mostra overlay de FPS — nunca em produção
   Loops (world/covers/mascots) consultam FX.paused / FX.low. */
window.FX = (() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = matchMedia('(max-width: 860px)').matches || (navigator.hardwareConcurrency || 8) <= 4;
  const FX = { paused: document.hidden, low: reduce || mobile, fps: 60, ms: 16.7, frames: 0 };
  let last = performance.now(), ema = 16.7, lowSince = 0;

  document.addEventListener('visibilitychange', () => {
    FX.paused = document.hidden;
    document.body.classList.toggle('hidden-tab', document.hidden);
  });

  const DBG = /[?#&]debug=1\b/.test(location.search + ' ' + location.hash) || /[#&]dbg\b/.test(location.hash);
  let dbgEl = null;
  if (DBG) {
    dbgEl = document.createElement('div');
    dbgEl.id = 'fxdbg';
    document.addEventListener('DOMContentLoaded', () => document.body.appendChild(dbgEl));
  }

  // acoplado ao loop do app (1x/frame, custo ~zero)
  FX.frame = (now) => {
    const dt = now - last; last = now;
    ema = ema * 0.95 + Math.min(100, dt) * 0.05;
    FX.fps = 1000 / Math.max(1, ema); FX.ms = ema; FX.frames++;
    if (!reduce && !FX.low && ema > 24) {
      if (!lowSince) lowSince = now;
      if (now - lowSince > 2000) { FX.low = true; document.body.classList.add('lowfx'); }
    } else if (ema < 20) lowSince = 0;
    if (dbgEl && FX.frames % 10 === 0) {
      dbgEl.textContent = `FPS ${FX.fps.toFixed(0)} · ${FX.ms.toFixed(1)}ms · ${FX.low ? 'LOW' : 'FULL'} · ${FX.paused ? 'PAUSED' : 'RUN'}`;
    }
  };

  if (FX.low) document.body.classList.add('lowfx');
  return FX;
})();
