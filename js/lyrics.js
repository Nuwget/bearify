/* bearify · letras PT/EN: um timestamp, dois idiomas. Compartilhado por desktop e mobile.
   Linha: { t, end, pt, en }. Idioma salvo em bearify.lyrlang (both | pt | en).
   Lyrics.mount(box, opts) renderiza a letra da faixa atual (ou de opts.track);
   Lyrics.paint(time) só toca no DOM quando a linha ativa muda. */
window.Lyrics = (() => {
  const E = window.Engine;
  const KEY = 'bearify.lyrlang';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const views = new Set();
  let last = { id: '', k: -2 };

  /* ---------------- idioma ---------------- */
  const pref = () => { try { const v = localStorage.getItem(KEY); return v === 'pt' || v === 'en' ? v : 'both'; } catch { return 'both'; } };
  function setPref(m) { try { localStorage.setItem(KEY, m); } catch {} refresh(); }
  function has(tr) { const ls = tr?.lyrics || []; return { any: ls.length > 0, pt: ls.some((l) => l.pt), en: ls.some((l) => l.en) }; }
  // idioma efetivo: o preferido se existir; senão o que a faixa tem
  function modeFor(tr, want = pref()) {
    const h = has(tr);
    if (!h.any) return null;
    if (want === 'pt' && h.pt) return 'pt';
    if (want === 'en' && h.en) return 'en';
    if (h.pt && h.en) return 'both';
    return h.pt ? 'pt' : 'en';
  }

  /* ---------------- markup ---------------- */
  function bar(tr, mode) {
    const h = has(tr);
    const opt = (m, label, ok) => `<button type="button" class="lyr-lang" data-lyr-lang="${m}" aria-pressed="${mode === m}" ${ok ? '' : 'disabled'}>${label}</button>`;
    const note = !h.pt ? 'Português indisponível para esta faixa.' : !h.en ? 'English indisponível para esta faixa.' : '';
    return `<div class="lyr-bar"><div class="lyr-langs" role="group" aria-label="Idioma da letra">${opt('both', 'Ambos', h.pt && h.en)}${opt('pt', 'Português', h.pt)}${opt('en', 'English', h.en)}</div>${note ? `<p class="lyr-note">${note}</p>` : ''}</div>`;
  }
  function lines(tr, mode) {
    return tr.lyrics.map((l, i) => `<button type="button" class="lyr" data-t="${l.t}" data-i="${i}">`
      + (mode !== 'en' && l.pt ? `<span class="l-pt"><em>Português</em><span class="t">${esc(l.pt)}</span></span>` : '')
      + (mode !== 'pt' && l.en ? `<span class="l-en"><em>English</em><span class="t">${esc(l.en)}</span></span>` : '')
      + '</button>').join('');
  }
  // linha única p/ prévias (ex.: card do Now Playing mobile)
  function peek(tr, k) {
    const mode = modeFor(tr); if (!mode) return null;
    const l = tr.lyrics[Math.max(0, k)];
    return { pt: mode !== 'en' ? l.pt : '', en: mode !== 'pt' ? l.en : '', dim: k < 0 };
  }

  /* ---------------- views ---------------- */
  function render(v) {
    const tr = v.track ? E.byId[v.track] : E.queue.current();
    v.tr = tr; v.lines = null;
    if (!tr?.lyrics?.length) { v.box.innerHTML = '<p class="lyr-none">Letra indisponível para esta faixa.</p>'; return; }
    const mode = modeFor(tr);
    v.box.innerHTML = bar(tr, mode)
      + `<div class="lyr-list is-${mode}">${mode === 'both' ? '<div class="lyr-cols"><span>Português</span><span>English</span></div>' : ''}${lines(tr, mode)}</div>`;
    v.lines = v.box.querySelectorAll('.lyr');
    const cur = E.queue.current();
    if (!v.track || (cur && v.track === cur.id)) apply(v, cur, E.lyrics.active(cur, E.player.el.currentTime || 0), false);
  }
  function refresh() {
    last = { id: '', k: -2 };
    views.forEach((v) => { if (!v.box.isConnected) views.delete(v); else render(v); });
    E.bus.emit('lyrics');
  }
  function mount(box, opts = {}) {
    unmount(box);
    const v = { box, track: opts.track || null, scroller: opts.scroller || null, visible: opts.visible || (() => true), scroll: opts.scroll !== false, hold: 0, lines: null, tr: null };
    if (v.scroller) {
      const hold = () => { v.hold = performance.now() + 4000; };
      v.scroller.addEventListener('touchmove', hold, { passive: true });
      v.scroller.addEventListener('wheel', hold, { passive: true });
    }
    views.add(v); render(v);
    return v;
  }
  function unmount(box) { views.forEach((v) => { if (v.box === box) views.delete(v); }); }

  /* ---------------- linha ativa + scroll ---------------- */
  function apply(v, cur, k, scroll) {
    if (!v.lines || !cur || (v.track && v.track !== cur.id)) return;
    v.lines.forEach((b, i) => { b.classList.toggle('on', i === k); b.classList.toggle('past', i < k); });
    if (scroll && k >= 0) follow(v, v.lines[k]);
  }
  // acompanha a linha só enquanto toca, visível e sem o usuário rolando à mão
  function follow(v, el) {
    if (!v.scroll || !v.scroller || E.player.status !== 'playing' || performance.now() < v.hold || !v.visible()) return;
    center(v, el, true);
  }
  function center(v, el, smooth) {
    const s = v.scroller, bar = v.box.querySelector('.lyr-bar');
    const r = el.getBoundingClientRect(), sr = s.getBoundingClientRect();
    const top = s.scrollTop + (r.top - sr.top) - ((s.clientHeight + (bar ? bar.offsetHeight : 0)) / 2 - r.height / 2);
    s.scrollTo({ top: Math.max(0, top), behavior: smooth && !reduce ? 'smooth' : 'auto' });
  }
  // abre a letra já na linha atual, sem animação
  function reveal(box) {
    views.forEach((v) => {
      if (v.box !== box || !v.lines || !v.scroller) return;
      const k = E.lyrics.active(E.queue.current(), E.player.el.currentTime || 0);
      if (k >= 0) center(v, v.lines[k], false); else v.scroller.scrollTo({ top: 0 });
    });
  }

  function paint(time) {
    const cur = E.queue.current(); if (!cur) return;
    const k = E.lyrics.active(cur, time);
    if (k === last.k && cur.id === last.id) return;
    last = { id: cur.id, k };
    views.forEach((v) => { if (!v.box.isConnected) views.delete(v); else apply(v, cur, k, true); });
    E.bus.emit('lyric', { track: cur, k });
  }

  /* ---------------- eventos ---------------- */
  document.addEventListener('click', (e) => {
    const line = e.target.closest('.lyr[data-t]');
    if (line) { const t = +line.dataset.t; E.player.el.currentTime = t; paint(t); return; }
    const b = e.target.closest('[data-lyr-lang]');
    if (b && !b.disabled) setPref(b.dataset.lyrLang);
  });
  E.bus.on('track', refresh);
  // ao voltar a tocar, retoma o acompanhamento da linha atual
  E.bus.on('status', ({ status }) => {
    if (status !== 'playing') return;
    const cur = E.queue.current(); if (!cur) return;
    const k = E.lyrics.active(cur, E.player.el.currentTime || 0);
    if (k >= 0) views.forEach((v) => { if (v.lines && (!v.track || v.track === cur.id)) follow(v, v.lines[k]); });
  });

  return { mount, unmount, paint, reveal, refresh, peek, pref, modeFor, has };
})();
