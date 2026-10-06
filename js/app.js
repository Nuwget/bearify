/* bearify · bootstrap: análise de áudio (só leitura → window.Levels),
   atalhos de teclado e o loop que move o dock, a letra e a cena. */
(() => {
  const E = window.Engine;
  const L = (window.Levels = window.Levels || { bass: 0, mid: 0, treble: 0 });

  /* ---------- tap de análise: o som nunca é processado, só medido ---------- */
  const canAnalyse = /^https?:$/.test(location.protocol);
  let actx = null, analyser = null, freq = null, bins = null, quiet = 0;
  window.__vizOn = false;
  function ensureAnalyser() {
    if (!canAnalyse || actx) return;
    if (FX.iso.noviz || FX.perf !== 'full') return; // mobile/battery: níveis sintéticos, sem custo
    window.__vizOn = true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      actx = new AC({ latencyHint: 'playback' });
      analyser = actx.createAnalyser();
      analyser.fftSize = 2048; analyser.smoothingTimeConstant = 0.8;
      E.elements.forEach((el) => {
        const src = actx.createMediaElementSource(el);
        src.connect(analyser); src.connect(actx.destination);
      });
      window.__actx = actx;
      freq = new Uint8Array(analyser.frequencyBinCount);
      const hz = actx.sampleRate / analyser.fftSize, b = (f) => Math.max(1, Math.round(f / hz));
      bins = { b0: b(35), b1: b(150), m0: b(250), m1: b(2000), t0: b(4000), t1: b(12000) };
      actx.resume();
    } catch { actx = null; analyser = null; }
  }
  addEventListener('pointerdown', ensureAnalyser, { once: true });
  addEventListener('keydown', ensureAnalyser, { once: true });

  function readLevels(t) {
    const el = E.player.el;
    const playing = el && !el.paused && !el.ended;
    let b = 0, m = 0, tr = 0;
    if (playing && analyser && actx.state === 'running') {
      analyser.getByteFrequencyData(freq);
      const avg = (a, z) => { let s = 0; for (let i = a; i < z; i++) s += freq[i]; return s / Math.max(1, z - a) / 255; };
      b = Math.pow(avg(bins.b0, bins.b1), 1.7) * 1.7;
      m = Math.pow(avg(bins.m0, bins.m1), 1.4) * 2.4;
      tr = Math.pow(avg(bins.t0, bins.t1), 1.2) * 3.6;
      quiet = b + m + tr < 0.003 ? quiet + 1 : 0;
    } else if (playing) quiet = 999;
    if (playing && quiet > 120) {
      const p = Math.pow(Math.max(0, Math.sin(t * 2.0)), 3);
      b = 0.22 + 0.35 * p; m = 0.28 + 0.18 * Math.sin(t * 0.9); tr = 0.2 + 0.14 * Math.sin(t * 3.1);
    }
    if (!playing) { b = 0.06 + 0.05 * Math.sin(t * 0.6); m = 0.05; tr = 0.04; }
    const sm = (c, v, up, dn) => c + (v - c) * (v > c ? up : dn);
    L.bass = sm(L.bass, Math.min(1, b), 0.32, 0.07);
    L.mid = sm(L.mid, Math.min(1, m), 0.22, 0.06);
    L.treble = sm(L.treble, Math.min(1, tr), 0.28, 0.08);
  }

  /* ---------- atalhos ---------- */
  addEventListener('keydown', (e) => {
    const tag = e.target.tagName;
    if (tag === 'INPUT' && e.target.type !== 'range' || tag === 'TEXTAREA') return;
    const P = E.player;
    if (e.code === 'Space') { e.preventDefault(); P.toggle(); }
    else if (e.code === 'ArrowLeft') { e.shiftKey ? P.prev() : P.seekBy(-5); }
    else if (e.code === 'ArrowRight') { e.shiftKey ? P.next() : P.seekBy(5); }
    else if (e.code === 'ArrowUp') { e.preventDefault(); P.setVolume(E.store.prefs.vol + 0.05); }
    else if (e.code === 'ArrowDown') { e.preventDefault(); P.setVolume(E.store.prefs.vol - 0.05); }
    else if (e.key === 'm' || e.key === 'M') P.toggleMute();
    else if (e.key === 'l' || e.key === 'L') P.cycleRepeat();
  });

  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.setActionHandler('play', () => E.player.play());
      navigator.mediaSession.setActionHandler('pause', () => E.player.pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => E.player.prev());
      navigator.mediaSession.setActionHandler('nexttrack', () => E.player.next());
      navigator.mediaSession.setActionHandler('seekbackward', () => E.player.seekBy(-10));
      navigator.mediaSession.setActionHandler('seekforward', () => E.player.seekBy(10));
    } catch {}
  }

  /* ---------- boot + loop ---------- */
  window.UI.init();
  FX.add('ui', (now) => {
    const t = now / 1000;
    readLevels(t);
    if (window.UI.onTick) window.UI.onTick(E.player.el);
  }, 60);
})();
