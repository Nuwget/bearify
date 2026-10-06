/* bearify · camada mobile (≤860px): um SITE no Safari, não um app.
   Sem bottom nav, sem PWA. Compartilha com o desktop só dados e engine.
   Peças: MobileShell · Header · Home · TrackList/TrackRow · MiniPlayer ·
   NowPlaying · Lyrics (lyrics.js) · Search · Library · Sheet.
   Regras: nada por frame além de progresso/letra (10fps), transform/opacity,
   o document rola (a barra do Safari recolhe sozinha). */
window.Mobile = (() => {
  const E = window.Engine, T = window.TRACKS, LIB = window.LIBRARY;
  const { allPlaylists, findPlaylist, plTheme, durations, esc } = window.UI.lib;
  const $ = (id) => document.getElementById(id);
  const fmt = E.fmt;
  const idx = (id) => T.findIndex((t) => t.id === id);
  const isMobile = () => FX.isMobile();
  const allIds = () => T.map((t) => t.id);

  const I = {
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg>',
    search: '<svg viewBox="0 0 24 24"><path d="M10 2a8 8 0 1 0 4.9 14.3l5.4 5.4 1.4-1.4-5.4-5.4A8 8 0 0 0 10 2zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12z"/></svg>',
    lib: '<svg viewBox="0 0 24 24"><path d="M4 3h3v18H4zM10 3h3v18h-3zm5 2h3l3 16h-3z"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M15.4 5.4 14 4l-8 8 8 8 1.4-1.4L8.8 12z"/></svg>',
    chev: '<svg viewBox="0 0 24 24"><path d="M8.6 5.4 10 4l8 8-8 8-1.4-1.4L15.2 12z"/></svg>',
  };
  const MOODS = [
    { id: 'madrugada', label: 'Madrugada', ids: ['welcome-to-your-past', 'silentreminante'] },
    { id: 'nostalgia', label: 'Nostalgia', ids: ['welcome-to-your-past', 'just-a-little-more-time'] },
    { id: 'chuva', label: 'Chuva', ids: ['silentreminante', 'welcome-to-your-past'] },
    { id: 'azul', label: 'Azul', ids: ['in-the-blue'] },
  ];

  let started = false;      // só destaca a faixa atual depois que o usuário toca algo
  let searchQ = '', mood = '', libTab = 'playlists';
  let navFromApp = false;
  let dragging = false, lastSec = -1;
  const layers = [];        // 'np' | 'lyrics' | 'sheet' — cada um empurra um estado no histórico (voltar do Safari fecha)

  /* ================= peças ================= */
  const cover = (tr, cls = '') => `<canvas class="cov ${cls}" data-i="${idx(tr.id)}" width="32" height="32" aria-hidden="true"></canvas>`;
  const plCover = (p, cls = '') => { const th = plTheme(p); return th ? `<canvas class="cov ${cls}" data-theme="${th}" width="32" height="32" aria-hidden="true"></canvas>` : cover(E.byId[p.tracks[0]] || T[0], cls); };
  const dur = (id) => (durations[id] != null ? fmt(durations[id]) : '—');
  // pinta já, sem esperar o próximo tick (nunca aparece um quadrado vazio)
  function paintNow(root) {
    root.querySelectorAll('canvas.cov').forEach((c) => { const i = +c.dataset.i || 0; Covers.draw(c, T[i] || {}, i, 0); });
  }

  function MobileTrackRow(tr) {
    return `<li><button type="button" class="m-row" data-m-track="${tr.id}" aria-label="Tocar ${esc(tr.title)}">
      <span class="m-thumb">${cover(tr)}</span>
      <span class="m-rt"><b>${esc(tr.title)}</b><span>${esc(tr.artist)}</span></span>
      <span class="m-eq" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="m-dur" data-dur="${tr.id}">${dur(tr.id)}</span>
    </button></li>`;
  }
  function MobileTrackList(ids) {
    const ts = ids.map((id) => E.byId[id]).filter(Boolean);
    if (!ts.length) return '<p class="m-empty">Nada por aqui ainda.</p>';
    return `<ul class="m-list" data-ids="${ts.map((t) => t.id).join(',')}">${ts.map(MobileTrackRow).join('')}</ul>`;
  }
  function linkRow(go, art, title, sub) {
    return `<li><button type="button" class="m-row m-row-go" data-m-go="${go}"><span class="m-thumb">${art}</span><span class="m-rt"><b>${esc(title)}</b><span>${esc(sub)}</span></span><span class="m-chev" aria-hidden="true">${I.chev}</span></button></li>`;
  }
  const playBtn = (attrs) => `<button type="button" class="m-cta" ${attrs}><span class="m-cta-ic"><i class="i-play">${I.play}</i><i class="i-pause">${I.pause}</i></span><span class="lp">Tocar</span><span class="lq">Pausar</span></button>`;

  /* ================= header ================= */
  function MobileHeader(title) {
    if (!title) {
      return `<div class="m-brand"><div><p class="m-logo">bearify</p><p class="m-tag">nuwget songs</p></div>
        <button type="button" class="m-btn m-ic" data-m-go="#/library" aria-label="Sua Biblioteca">${I.lib}</button></div>
        <button type="button" class="m-searchpill" data-m-go="#/search">${I.search}<span>Buscar</span></button>`;
    }
    return `<div class="m-bar"><button type="button" class="m-btn m-ic" data-m-back aria-label="voltar">${I.back}</button><h1>${esc(title)}</h1><span class="m-ic-sp"></span></div>`;
  }
  function show(head, html) {
    $('mHead').innerHTML = head;
    const v = $('mView'); v.innerHTML = html;
    v.classList.remove('enter'); void v.offsetWidth; v.classList.add('enter');
    paintNow($('m')); markCurrent();
    scrollTo(0, 0);
  }

  /* ================= telas ================= */
  function MobileHome() {
    const alb = LIB.ALBUMS[0];
    show(MobileHeader(), `
      <section class="m-feat">
        <p class="m-k">Em destaque</p>
        <div class="m-feat-art">${cover(E.byId[alb.tracks[0]])}</div>
        <h2>${esc(alb.title)}</h2>
        <p class="m-feat-s">${esc(alb.artist)} · ${alb.year} · ${alb.tracks.length} songs</p>
        ${playBtn(`data-m-playlist="${alb.id}"`)}
      </section>
      <section><h3 class="m-sec">Músicas</h3>${MobileTrackList(alb.tracks)}</section>
      <button type="button" class="m-link" data-m-about>Quem é Nuwget?</button>`);
  }

  function MobileSearch() {
    show(MobileHeader('Buscar'), `<div class="m-sbox">${I.search}<input id="mQ" type="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="O que você quer ouvir?" value="${esc(searchQ)}" aria-label="buscar"></div><div id="mSres"></div>`);
    $('mQ').addEventListener('input', (e) => { searchQ = e.target.value; renderSearch(); });
    renderSearch();
  }
  function renderSearch() {
    const box = $('mSres'); if (!box) return;
    const s = searchQ.trim().toLowerCase();
    if (!s) {
      const m = MOODS.find((x) => x.id === mood);
      box.innerHTML = `<h3 class="m-sec">Explorar</h3>
        <div class="m-moods">${MOODS.map((x) => `<button type="button" class="m-mood${x.id === mood ? ' on' : ''}" data-m-mood="${x.id}">${x.label}</button>`).join('')}</div>
        ${m ? MobileTrackList(m.ids) : ''}`;
    } else {
      const hits = T.filter((t) => `${t.title} ${t.artist} ${t.album}`.toLowerCase().includes(s));
      const albs = LIB.ALBUMS.filter((a) => `${a.title} ${a.artist}`.toLowerCase().includes(s));
      const arts = LIB.ARTISTS.filter((a) => a.name.toLowerCase().includes(s));
      const pls = allPlaylists().filter((p) => `${p.name} ${p.desc}`.toLowerCase().includes(s));
      if (!hits.length && !albs.length && !arts.length && !pls.length) box.innerHTML = `<p class="m-empty">Nada encontrado para “${esc(searchQ)}”.</p>`;
      else box.innerHTML = [
        hits.length && `<h3 class="m-sec">Songs</h3>${MobileTrackList(hits.map((t) => t.id))}`,
        albs.length && `<h3 class="m-sec">Álbuns</h3><ul class="m-list">${albs.map((a) => linkRow('#/album/' + a.id, cover(E.byId[a.tracks[0]]), a.title, `álbum · ${a.artist}`)).join('')}</ul>`,
        arts.length && `<h3 class="m-sec">Artistas</h3><ul class="m-list">${arts.map((a) => linkRow('#/artist/' + a.id, cover(T[0]), a.name, 'artista')).join('')}</ul>`,
        pls.length && `<h3 class="m-sec">Playlists</h3><ul class="m-list">${pls.map((p) => linkRow('#/playlist/' + p.id, plCover(p), p.name, `playlist · ${p.tracks.length} songs`)).join('')}</ul>`,
      ].filter(Boolean).join('');
    }
    paintNow(box); markCurrent();
  }

  function MobileLibrary() {
    const tabs = { playlists: 'Playlists', albums: 'Álbuns', artists: 'Artistas', songs: 'Songs' };
    show(MobileHeader('Sua Biblioteca'), `<div class="m-seg" role="tablist">${Object.entries(tabs).map(([k, v]) => `<button type="button" role="tab" data-m-lib="${k}" aria-selected="${k === libTab}">${v}</button>`).join('')}</div><div id="mLibBody"></div>`);
    renderLibrary();
  }
  function renderLibrary() {
    const b = $('mLibBody'); if (!b) return;
    document.querySelectorAll('[data-m-lib]').forEach((x) => x.setAttribute('aria-selected', String(x.dataset.mLib === libTab)));
    if (libTab === 'songs') b.innerHTML = MobileTrackList(allIds());
    else if (libTab === 'albums') b.innerHTML = `<ul class="m-list">${LIB.ALBUMS.map((a) => linkRow('#/album/' + a.id, cover(E.byId[a.tracks[0]]), a.title, `${a.artist} · ${a.year}`)).join('')}</ul>`;
    else if (libTab === 'artists') b.innerHTML = `<ul class="m-list">${LIB.ARTISTS.map((a) => linkRow('#/artist/' + a.id, cover(T[0]), a.name, 'artista')).join('')}</ul>`;
    else b.innerHTML = `<ul class="m-list">${allPlaylists().map((p) => linkRow('#/playlist/' + p.id, plCover(p), p.name, `${p.tracks.length} songs`)).join('')}</ul>`;
    paintNow(b); markCurrent();
  }

  // álbum / artista / playlist: mesma tela simples
  function MobileCollection(kind, id) {
    let c = null;
    if (kind === 'album') { const a = LIB.ALBUMS.find((x) => x.id === id); if (a) c = { title: a.title, sub: `${a.artist} · ${a.year} · ${a.tracks.length} songs`, ids: a.tracks, art: cover(E.byId[a.tracks[0]]) }; }
    if (kind === 'artist') { const a = LIB.ARTISTS.find((x) => x.id === id); if (a) { const ids = T.filter((t) => t.artistId === id).map((t) => t.id); c = { title: a.name, sub: `artista · ${ids.length} songs`, ids, art: cover(T[0]) }; } }
    if (kind === 'playlist') { const p = findPlaylist(id); if (p) c = { title: p.name, sub: `${p.desc || 'playlist'} · ${p.tracks.length} songs`, ids: p.tracks, art: plCover(p) }; }
    if (!c) return false;
    show(MobileHeader(' '), `
      <section class="m-feat m-feat-sm">
        <div class="m-feat-art">${c.art}</div>
        <h2>${esc(c.title)}</h2>
        <p class="m-feat-s">${esc(c.sub)}</p>
        ${c.ids.length ? playBtn(`data-m-playids="${c.ids.join(',')}"`) : ''}
      </section>
      <section>${MobileTrackList(c.ids)}</section>`);
    return true;
  }

  function route() {
    if (!isMobile()) return;
    const [, r, arg] = (location.hash || '#/home').split('/');
    if (r === 'search') MobileSearch();
    else if (r === 'library') MobileLibrary();
    else if (['album', 'artist', 'playlist'].includes(r) && MobileCollection(r, arg)) { /* ok */ }
    else MobileHome();
  }
  function go(hash) { navFromApp = true; location.hash = hash; }
  function back() { if (navFromApp) { navFromApp = false; history.back(); } else location.hash = '#/home'; }

  /* ================= reprodução ================= */
  const sameList = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  // sempre síncrono dentro do gesto (exigência do Safari)
  function playList(ids, startId) {
    started = true;
    const cur = E.queue.current();
    if (cur && cur.id === startId && sameList(E.queue.list, ids)) E.player.toggle();
    else { E.queue.set(ids, startId); E.player.load(E.byId[startId], { autoplay: true }); }
    showMini();
  }
  function showMini() { started = true; const m = $('mMini'); m.inert = false; m.classList.add('show'); document.body.classList.add('m-hasmini'); markCurrent(); }
  function markCurrent() {
    const id = started ? E.queue.current()?.id : null;
    document.querySelectorAll('#m .m-row[data-m-track]').forEach((r) => r.classList.toggle('on', r.dataset.mTrack === id));
  }

  /* ================= camadas (NP / letra / sheet) ================= */
  function pushLayer(name) { layers.push(name); history.pushState({ mLayer: layers.length }, ''); }
  function popLayers(to) { while (layers.length > to) closeLayerUI(layers.pop()); }
  function closeLayerUI(name) {
    if (name === 'np') { const np = $('mNP'); np.classList.remove('open'); np.inert = true; document.body.classList.remove('m-lock'); }
    else if (name === 'lyrics') $('mNP').dataset.view = 'player';
    else if (name === 'sheet') { const w = $('mSheet'); w.classList.remove('open'); w.inert = true; }
  }
  const closeTop = () => { if (layers.length) history.back(); };

  function openNP() {
    if (layers.includes('np')) return;
    syncNP(); syncTime(E.player.el, true);
    const np = $('mNP'); np.dataset.view = 'player'; np.inert = false; np.classList.add('open');
    document.body.classList.add('m-lock');
    pushLayer('np');
  }
  function openLyrics() {
    if (!layers.includes('np') || layers.includes('lyrics') || !E.queue.current()?.lyrics?.length) return;
    $('mNP').dataset.view = 'lyrics';
    pushLayer('lyrics');
    Lyrics.reveal($('mLyr'));
  }
  function openSheet(html) {
    $('mSheetBody').innerHTML = html; paintNow($('mSheetBody'));
    const w = $('mSheet'); w.inert = false;
    if (!layers.includes('sheet')) { void w.offsetWidth; w.classList.add('open'); pushLayer('sheet'); }
  }
  function openAbout() {
    const playing = document.body.classList.contains('playing');
    openSheet(`<span class="m-grab" aria-hidden="true"></span>
      <canvas class="cov m-about-art" data-theme="nuwget" data-wide width="64" height="32" aria-hidden="true"></canvas>
      <p class="m-k">O universo por trás do Bearify</p>
      <h2>Quem é Nuwget?</h2>
      <p class="m-about-p">Nuwget é o nome por trás das songs do Bearify: um pequeno universo musical feito para ouvir, com músicas e letras criadas junto com inteligência artificial.</p>
      <p class="m-about-sign">made with heart 💜</p>
      <button type="button" class="m-cta" data-m-about-play>${I.play}<span>${playing ? 'Voltar para a música' : 'Ouvir as songs'}</span></button>`);
  }
  function openMore() {
    openSheet(`<span class="m-grab" aria-hidden="true"></span>
      <button type="button" class="m-act" data-m-act="copy">Copiar link do site</button>
      <button type="button" class="m-act" data-m-act="about">Quem é Nuwget?</button>`);
  }

  /* ================= sincronização ================= */
  function qualityText() {
    const tr = E.queue.current(), srcs = tr && E.quality.cache[tr.id];
    if (!srcs) return '';
    const el = E.player.el;
    E.quality.withKbps(srcs, el.duration || durations[tr.id] || 0);
    const s = srcs.find((x) => (el.currentSrc || '').endsWith(x.url)) || srcs[0];
    return s.label + (s.kbps ? ` · ~${s.kbps} kbps` : '');
  }
  function syncQuality() { $('mNpQuality').textContent = qualityText(); }
  function syncPeek() {
    const tr = E.queue.current(), card = $('mLyrOpen'), line = $('mLyrPeek');
    if (!tr?.lyrics?.length) { card.disabled = true; $('mLyrCta').hidden = true; line.className = 'm-lyrcard-line none'; line.textContent = 'Letra indisponível para esta faixa.'; return; }
    card.disabled = false; $('mLyrCta').hidden = false;
    const p = Lyrics.peek(tr, E.lyrics.active(tr, E.player.el.currentTime || 0));
    line.className = 'm-lyrcard-line' + (p.dim ? ' dim' : '');
    line.innerHTML = (p.pt ? `<span class="pt">${esc(p.pt)}</span>` : '') + (p.en ? `<span class="en">${esc(p.en)}</span>` : '');
  }
  function syncFav() {
    const tr = E.queue.current(); if (!tr) return;
    const on = E.store.isLiked(tr.id); const f = $('mNpFav');
    f.classList.toggle('on', on); f.setAttribute('aria-pressed', String(on));
  }
  function syncModes() {
    const p = E.store.prefs;
    $('mShuffle').setAttribute('aria-pressed', String(p.shuffle));
    const l = $('mLoop'); l.setAttribute('aria-pressed', String(p.repeat !== 'off')); l.dataset.state = p.repeat;
  }
  function syncNP() {
    const tr = E.queue.current(); if (!tr) return;
    const i = idx(tr.id);
    for (const id of ['mNpArt', 'mMiniArt']) { const c = $(id); c.dataset.i = i; Covers.draw(c, tr, i, 0); }
    $('mMiniTitle').textContent = tr.title; $('mMiniArtist').textContent = tr.artist;
    $('mNpTitle').textContent = tr.title; $('mNpArtist').textContent = tr.artist; $('mNpAlbum').textContent = tr.album;
    $('mLyrTrack').textContent = tr.title;
    syncQuality(); syncFav(); syncModes(); syncPeek();
  }
  // só o player se mexe: texto 1x/s, barras por transform, letra por mudança de linha
  function syncTime(el, force) {
    const tr = E.queue.current(); if (!tr) return;
    const d = el.duration || durations[tr.id] || 0, ct = el.currentTime || 0, f = d ? Math.min(1, ct / d) : 0;
    const np = layers.includes('np'), sc = 'scaleX(' + f.toFixed(4) + ')';
    $('mMiniFill').style.transform = sc;
    if (np) {
      const sec = Math.floor(ct);
      if (sec !== lastSec || force) { lastSec = sec; if (!dragging) $('mCur').textContent = fmt(ct); $('mDur').textContent = fmt(d); }
      if (!dragging) { $('mSeek').value = f * 1000; $('mSeekFill').style.transform = sc; }
      if (layers.includes('lyrics')) $('mLyrFill').style.transform = sc;
    }
    Lyrics.paint(ct);
  }
  function onTick(el) {
    if (!isMobile() || el.paused) return;
    syncTime(el);
  }

  /* ================= eventos ================= */
  function bind() {
    addEventListener('hashchange', route);
    addEventListener('popstate', () => popLayers((history.state && history.state.mLayer) | 0));
    addEventListener('keydown', (e) => { if (e.key === 'Escape') closeTop(); });
    const P = E.player;

    $('m').addEventListener('click', (e) => {
      const q = (s) => e.target.closest(s); let m;
      if ((m = q('[data-m-track]'))) {
        const ids = (m.closest('[data-ids]')?.dataset.ids || '').split(',').filter(Boolean);
        playList(ids.length ? ids : allIds(), m.dataset.mTrack);
      } else if ((m = q('[data-m-playlist]'))) { const a = LIB.ALBUMS.find((x) => x.id === m.dataset.mPlaylist); playList(a.tracks, E.queue.current() && a.tracks.includes(E.queue.current().id) && started ? E.queue.current().id : a.tracks[0]); }
      else if ((m = q('[data-m-playids]'))) { const ids = m.dataset.mPlayids.split(','); const cur = E.queue.current(); playList(ids, started && cur && ids.includes(cur.id) ? cur.id : ids[0]); }
      else if ((m = q('[data-m-go]'))) go(m.dataset.mGo);
      else if (q('[data-m-back]')) back();
      else if ((m = q('[data-m-lib]'))) { libTab = m.dataset.mLib; renderLibrary(); }
      else if ((m = q('[data-m-mood]'))) { mood = mood === m.dataset.mMood ? '' : m.dataset.mMood; renderSearch(); }
      else if (q('[data-m-about]')) openAbout();
      else if (q('[data-m-about-play]')) {
        if (document.body.classList.contains('playing')) { closeTop(); return; }
        const a = LIB.ALBUMS[0]; playList(a.tracks, a.tracks[0]); closeTop();
      } else if ((m = q('[data-m-act]'))) {
        if (m.dataset.mAct === 'about') openAbout();
        else { navigator.clipboard?.writeText(location.href.split('#')[0]).then(() => UI.toast('Link copiado'), () => UI.toast('Não consegui copiar o link')); closeTop(); }
      } else if (q('[data-m-sheet-close]')) closeTop();
    });

    // mini player
    $('mMiniOpen').addEventListener('click', openNP);
    $('mMiniPlay').addEventListener('click', () => P.toggle());
    $('mMiniNext').addEventListener('click', () => P.next());
    // now playing
    $('mNpClose').addEventListener('click', closeTop);
    $('mNpMore').addEventListener('click', openMore);
    $('mPlay').addEventListener('click', () => P.toggle());
    $('mNext').addEventListener('click', () => P.next());
    $('mPrev').addEventListener('click', () => P.prev());
    $('mShuffle').addEventListener('click', () => { UI.toast(P.toggleShuffle() ? 'Aleatório ligado' : 'Aleatório desligado'); syncModes(); });
    $('mLoop').addEventListener('click', () => { const r = P.cycleRepeat(); UI.toast('Repetir: ' + { off: 'desligado', all: 'tudo', one: 'uma música' }[r]); syncModes(); });
    $('mNpFav').addEventListener('click', () => { const tr = E.queue.current(); if (tr) { const on = E.store.toggleLike(tr.id); UI.toast(on ? 'Adicionada aos favoritos' : 'Removida dos favoritos'); } });
    $('mLyrOpen').addEventListener('click', openLyrics);
    $('mLyrClose').addEventListener('click', closeTop);
    $('mLyrPlay').addEventListener('click', () => P.toggle());
    $('mLyrNext').addEventListener('click', () => P.next());
    $('mLyrPrev').addEventListener('click', () => P.prev());
    // timeline: arrastar só mexe no visual; o seek acontece ao soltar
    const seek = $('mSeek');
    seek.addEventListener('input', () => {
      dragging = true;
      const d = P.el.duration || 0, f = seek.value / 1000;
      $('mCur').textContent = fmt(f * d); $('mSeekFill').style.transform = 'scaleX(' + f + ')';
    });
    seek.addEventListener('change', () => { P.seek(seek.value / 1000); dragging = false; syncTime(P.el, true); });

    for (const el of E.elements) for (const ev of ['seeked', 'loadedmetadata', 'durationchange']) el.addEventListener(ev, () => { if (isMobile() && el === P.el) { syncTime(el, true); syncPeek(); syncQuality(); } });

    E.bus.on('track', () => { lastSec = -1; syncNP(); markCurrent(); });
    E.bus.on('meta', syncQuality);
    E.bus.on('lyric', () => { if (isMobile()) syncPeek(); });
    E.bus.on('lyrics', syncPeek);
    E.bus.on('likes', syncFav);
    E.bus.on('mode', syncModes);
    E.bus.on('status', ({ status, message }) => {
      if (status === 'playing') showMini();
      $('mNpState').textContent = status === 'loading' ? 'carregando…' : status === 'buffering' ? 'carregando…' : status === 'error' ? message || 'erro de áudio' : '';
      if (status === 'error' && isMobile()) UI.toast(message || 'Não consegui tocar essa música', 4200);
    });
  }

  function init() {
    if (history.state && history.state.mLayer) history.replaceState(null, ''); // recarregou com NP aberto: começa limpo
    bind();
    Lyrics.mount($('mLyr'), { scroller: $('mLyr'), visible: () => layers.includes('lyrics') });
    syncNP();
    route();
  }

  return { init, route, onTick };
})();
