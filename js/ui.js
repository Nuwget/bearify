/* bearify · UI: rotas, telas, fila, letra, modais, menu de contexto. */
window.UI = (() => {
  const E = window.Engine;
  const T = window.TRACKS, LIB = window.LIBRARY;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const GLOW = ['rgba(91,59,176,.4)', 'rgba(30,90,168,.4)', 'rgba(200,85,61,.35)', 'rgba(71,61,110,.4)'];
  const idx = (id) => T.findIndex((t) => t.id === id);
  const durations = {};
  const fmt = E.fmt;

  function toast(msg, ms = 2600) {
    const t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), ms);
  }

  /* ---------------- playlists do usuário + curtidas ---------------- */
  function userPlaylists() { return E.store.playlists || []; }
  function allPlaylists() {
    const liked = { id: 'liked', name: 'Liked Songs', desc: 'Suas favoritas.', tracks: E.store.likes.filter((id) => E.byId[id]) };
    const live = LIB.PLAYLISTS.map((p) => (p.id === 'pl-ouvindo' ? { ...p, tracks: [...E.store.recent] } : p));
    return [liked, ...live, ...userPlaylists()];
  }
  function findPlaylist(id) { return allPlaylists().find((p) => p.id === id); }

  /* ---------------- thumbs / durações ---------------- */
  function probeDurations() {
    T.forEach((tr) => {
      if (durations[tr.id] != null) return;
      const a = new Audio(); a.preload = 'metadata'; a.src = `${tr.base}.m4a`;
      a.onloadedmetadata = () => { durations[tr.id] = a.duration; document.querySelectorAll(`[data-dur="${tr.id}"]`).forEach((e) => (e.textContent = fmt(a.duration))); };
    });
  }

  /* ---------------- peças ---------------- */
  function thumb(tr, cls = 'thumb') { return `<canvas class="cov ${cls}" data-i="${idx(tr.id)}" width="32" height="32" aria-hidden="true"></canvas>`; }
  function likeBtn(tr) { return `<button class="iconbtn sm ${E.store.isLiked(tr.id) ? 'loved' : ''}" data-like="${tr.id}" aria-label="favoritar" aria-pressed="${E.store.isLiked(tr.id)}"><svg viewBox="0 0 24 24"><path d="M12 21C7 16.5 3 13 3 8.8 3 6 5.2 4 7.8 4c1.7 0 3.2.9 4.2 2.3C13 4.9 14.5 4 16.2 4 18.8 4 21 6 21 8.8c0 4.2-4 7.7-9 12.2z"/></svg></button>`; }
  function moreBtn(tr) { return `<button class="iconbtn sm" data-more="${tr.id}" aria-label="mais opções"><svg viewBox="0 0 24 24"><path d="M12 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg></button>`; }

  function trackRow(tr, n) {
    return `<div class="trow" data-play="${tr.id}" role="button" tabindex="0">
      <span class="num"><span>${n}</span><button data-play="${tr.id}" aria-label="tocar ${esc(tr.title)}"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></button></span>
      ${thumb(tr)}
      <span class="tt"><b>${esc(tr.title)}</b><span>${esc(tr.artist)}</span></span>
      <span class="acts">${likeBtn(tr)}${moreBtn(tr)}</span>
      <span class="dur" data-dur="${tr.id}">${durations[tr.id] != null ? fmt(durations[tr.id]) : '—'}</span>
    </div>`;
  }

  function trackCard(tr) {
    return `<div class="card" data-album="${tr.albumId}" role="button" tabindex="0">
      <div class="artw">${thumb(tr, 'art')}<span class="hov"><button data-play="${tr.id}" aria-label="tocar ${esc(tr.title)}"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></button></span></div>
      <p class="ct">${esc(tr.title)}</p><p class="cs">${esc(tr.artist)} · ${esc(tr.album)}</p>
    </div>`;
  }

  function plTheme(p) {
    return { liked: 'heart', 'pl-sessions': 'collage', 'pl-madrugada': 'madrugada', 'pl-mare': 'mare', 'pl-ouvindo': 'resume' }[p.id] || null;
  }
  function plThumb(p, cls = 'thumb') {
    const th = plTheme(p);
    if (th) return `<canvas class="cov ${cls}" data-theme="${th}" width="32" height="32" aria-hidden="true"></canvas>`;
    return thumb(E.byId[p.tracks[0]] || T[0], cls);
  }
  function hero(kind, title, meta, i, theme) {
    const art = theme
      ? `<canvas class="big cov" data-theme="${theme}" width="32" height="32"></canvas>`
      : `<canvas class="big cov" data-i="${i}" width="32" height="32"></canvas>`;
    return `<div class="hero">${art}
      <div><p class="hk">${kind}</p><h1>${esc(title)}</h1><p class="hm">${meta}</p></div></div>`;
  }

  /* ---------------- views ---------------- */
  const view = $('view');
  function greeting() { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; }

  function vHome() {
    const recent = E.store.recent.map((id) => E.byId[id]).filter(Boolean);
    const alb = LIB.ALBUMS[0], feat = E.byId[alb.tracks[0]];
    const mixes = allPlaylists();
    view.innerHTML = `
      <h1 class="hello">${greeting()} 🐻</h1><p class="sub">bearify · nuwget songs — seu streaming exclusivo.</p>
      <div class="fhero">
        <canvas class="cov fh" data-i="${idx(feat.id)}" width="32" height="32" aria-hidden="true"></canvas>
        <div class="fmeta"><p class="fk">Em destaque · álbum</p><h2>${esc(alb.title)}</h2>
        <p class="fm">${esc(alb.artist)} · ${alb.year} · ${alb.tracks.length} songs</p>
        <div class="actions">
          <button class="btn-play" data-playalbum="${alb.id}"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Tocar</button>
          <button class="btn-ghost" data-shufflealbum="${alb.id}">Aleatório</button>
          <button class="btn-ghost" data-album="${alb.id}">Abrir álbum</button>
        </div></div>
      </div>
      ${LIB.ALBUMS.map((a) => `<h2 class="sec-t">${esc(a.title)}<small>álbum · ${a.year}</small></h2>${a.tracks.map((x) => E.byId[x]).map((t, i) => trackRow(t, i + 1)).join('')}`).join('')}
      <h2 class="sec-t">Atalhos rápidos</h2>
      <div class="quick">${T.map((tr) => `<button class="qcard" data-play="${tr.id}">${thumb(tr)}<span>${esc(tr.title)}</span><span class="mini-play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span></button>`).join('')}</div>
      ${recent.length ? `<h2 class="sec-t">Tocadas recentemente</h2><div class="hrow">${recent.map(trackCard).join('')}</div>` : ''}
      <h2 class="sec-t">Feito pra você<small>${mixes.length} playlists</small></h2>
      <div class="hrow">${mixes.map((p) => `<div class="card" data-pl="${p.id}" role="button" tabindex="0"><div class="artw">${plThumb(p, 'art')}<span class="hov"><button data-playpl="${p.id}" aria-label="tocar playlist"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></button></span></div><p class="ct">${esc(p.name)}</p><p class="cs">${p.tracks.length} songs</p></div>`).join('')}</div>
      <h2 class="sec-t">Lançamentos</h2>
      <div class="hrow">${LIB.ALBUMS.map((a) => { const f = E.byId[a.tracks[0]]; return `<div class="card" data-album="${a.id}" role="button" tabindex="0"><div class="artw">${thumb(f, 'art')}</div><p class="ct">${esc(a.title)}</p><p class="cs">${esc(a.artist)} · ${a.year}</p></div>`; }).join('')}</div>
      <h2 class="sec-t">Mais do nuwget</h2>
      <div class="hrow">
        <div class="card" data-artist="nuwget" role="button" tabindex="0"><div class="artw">${thumb(T[0], 'art')}</div><p class="ct">nuwget</p><p class="cs">artista</p></div>
        <div class="card" data-pl="liked" role="button" tabindex="0"><div class="artw">${thumb(T[2], 'art')}</div><p class="ct">Liked Songs</p><p class="cs">${E.store.likes.length} favoritas</p></div>
        <div class="card" data-go="#/settings" role="button" tabindex="0"><div class="artw">${thumb(T[3], 'art')}</div><p class="ct">Áudio & qualidade</p><p class="cs">configurações</p></div>
      </div>`;
  }

  let searchQ = '';
  function recentQ() { try { return JSON.parse(localStorage.getItem('bearify.q') || '[]'); } catch { return []; } }
  function pushQ(q) { q = q.trim(); if (!q) return; try { localStorage.setItem('bearify.q', JSON.stringify([q, ...recentQ().filter((x) => x !== q)].slice(0, 6))); } catch {} }
  function vSearch() {
    view.innerHTML = `<h1 class="hello">Buscar</h1><p class="sub">Songs, artistas, álbuns e playlists do ecossistema nuwget.</p>
      <div class="searchbar"><input id="q" type="search" placeholder="O que você quer ouvir?" value="${esc(searchQ)}" aria-label="buscar"></div><div id="sres"></div>`;
    const q = $('q'); q.focus();
    q.addEventListener('input', () => { searchQ = q.value; renderSearch(); });
    q.addEventListener('keydown', (e) => { if (e.key === 'Enter') { pushQ(q.value); renderSearch(); } });
    renderSearch();
  }
  function renderSearch() {
    const box = $('sres'); if (!box) return;
    const s = searchQ.trim().toLowerCase();
    if (!s) {
      const rq = recentQ();
      box.innerHTML = rq.length
        ? `<h2 class="sec-t">Buscas recentes</h2><div class="chips">${rq.map((x) => `<button data-qchip="${esc(x)}">${esc(x)}</button>`).join('')}</div>`
        : `<div class="empty"><b>Explore o catálogo</b>Digite para buscar nas songs do nuwget.</div>`;
      return;
    }
    const hits = T.filter((t) => (t.title + ' ' + t.artist + ' ' + t.album).toLowerCase().includes(s));
    const albs = LIB.ALBUMS.filter((a) => (a.title + ' ' + a.artist).toLowerCase().includes(s));
    const arts = LIB.ARTISTS.filter((a) => a.name.toLowerCase().includes(s));
    const pls = allPlaylists().filter((p) => (p.name + ' ' + p.desc).toLowerCase().includes(s));
    if (!hits.length && !albs.length && !arts.length && !pls.length) { box.innerHTML = `<div class="empty"><b>Nada encontrado para “${esc(searchQ)}”</b>Tente outro termo.</div>`; return; }
    const best = hits[0];
    box.innerHTML = `
      ${best ? `<h2 class="sec-t">Melhor resultado</h2><div class="best" data-play="${best.id}">${thumb(best)}<div><b>${esc(best.title)}</b><span>${esc(best.artist)} · song</span></div></div>` : ''}
      ${hits.length ? `<h2 class="sec-t">Songs</h2>${hits.map((t, i) => trackRow(t, i + 1)).join('')}` : ''}
      ${albs.length ? `<h2 class="sec-t">Álbuns</h2><div class="hrow">${albs.map((a) => { const f = E.byId[a.tracks[0]]; return `<div class="card" data-album="${a.id}"><div class="artw">${thumb(f, 'art')}</div><p class="ct">${esc(a.title)}</p><p class="cs">${esc(a.artist)}</p></div>`; }).join('')}</div>` : ''}
      ${arts.length ? `<h2 class="sec-t">Artistas</h2><div class="hrow">${arts.map((a) => `<div class="card" data-artist="${a.id}"><div class="artw">${thumb(T[0], 'art')}</div><p class="ct">${esc(a.name)}</p><p class="cs">artista</p></div>`).join('')}</div>` : ''}
      ${pls.length ? `<h2 class="sec-t">Playlists</h2>${pls.map((p) => `<div class="trow" data-pl="${p.id}"><span class="num">▤</span>${plThumb(p)}<span class="tt"><b>${esc(p.name)}</b><span>playlist · ${p.tracks.length} songs</span></span><span></span><span></span></div>`).join('')}` : ''}`;
  }

  let libTab = 'playlists', libFilter = 'all';
  function vLibrary() {
    const likes = E.store.likes;
    view.innerHTML = `<h1 class="hello">Sua Biblioteca</h1><p class="sub">${T.length} songs · ${LIB.ALBUMS.length} álbum · ${LIB.ARTISTS.length} artista</p>
      <div class="tabs">${['playlists', 'albums', 'artists', 'songs'].map((t) => `<button data-lib="${t}" class="${libTab === t ? 'on' : ''}">${{ playlists: 'Playlists', albums: 'Álbuns', artists: 'Artistas', songs: 'Songs' }[t]}</button>`).join('')}</div>
      <div class="chips">${['all', 'liked', 'recent'].map((c) => `<button data-chip="${c}" class="${libFilter === c ? 'on' : ''}">${{ all: 'Todas', liked: 'Favoritas', recent: 'Recentes' }[c]}</button>`).join('')}</div>
      <div id="libBody"></div>`;
    renderLibBody();
  }
  function libTracks() {
    let ids = T.map((t) => t.id);
    if (libFilter === 'liked') ids = E.store.likes.filter((id) => E.byId[id]);
    if (libFilter === 'recent') ids = E.store.recent;
    return ids.map((id) => E.byId[id]).filter(Boolean);
  }
  function renderLibBody() {
    const b = $('libBody'); if (!b) return;
    if (libTab === 'songs') {
      const ts = libTracks();
      b.innerHTML = ts.length ? ts.map((t, i) => trackRow(t, i + 1)).join('') : `<div class="empty"><b>Nada aqui</b>${libFilter === 'liked' ? 'Toque no coração de uma song para favoritá-la.' : 'Ouça algo primeiro.'}</div>`;
    } else if (libTab === 'playlists') {
      b.innerHTML = `<div class="hrow" style="grid-auto-columns:200px;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));grid-auto-flow:row;">${allPlaylists().map((p) => `<div class="card" data-pl="${p.id}"><div class="artw">${plThumb(p, 'art')}</div><p class="ct">${esc(p.name)}</p><p class="cs">${p.tracks.length} songs</p></div>`).join('')}</div>
      <div style="margin-top:14px"><button class="btn-ghost" data-newpl>Criar playlist</button></div>`;
    } else if (libTab === 'albums') {
      b.innerHTML = LIB.ALBUMS.map((a) => { const ts = a.tracks.map((id) => E.byId[id]); return hero('Álbum', a.title, `<b>${esc(a.artist)}</b> · ${a.year} · ${ts.length} songs`, idx(ts[0].id)) + `<div class="actions"><button class="btn-play" data-playalbum="${a.id}"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Tocar</button><button class="btn-ghost" data-gotoalbum="${a.id}">Abrir álbum</button></div>`; }).join('');
    } else {
      b.innerHTML = LIB.ARTISTS.map((a) => hero('Artista', a.name, esc(a.bio), 0) + `<div class="actions"><button class="btn-ghost" data-artist="${a.id}">Abrir artista</button></div>`).join('');
    }
  }

  function vAlbum(id) {
    const a = LIB.ALBUMS.find((x) => x.id === id); if (!a) return vHome();
    const ts = a.tracks.map((x) => E.byId[x]);
    view.innerHTML = hero('Álbum', a.title, `<b>${esc(a.artist)}</b> · ${a.year} · ${ts.length} songs`, idx(ts[0].id)) + `
      <div class="actions"><button class="btn-play" data-playalbum="${a.id}"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Tocar</button>
      <button class="btn-ghost" data-shufflealbum="${a.id}">Aleatório</button></div>
      ${ts.map((t, i) => trackRow(t, i + 1)).join('')}`;
  }

  function vArtist(id) {
    const a = LIB.ARTISTS.find((x) => x.id === id); if (!a) return vHome();
    const ts = T.filter((t) => t.artistId === id);
    const albs = LIB.ALBUMS.filter((x) => x.artistId === id);
    view.innerHTML = hero('Artista', a.name, esc(a.bio), 0) + `
      <div class="actions"><button class="btn-play" data-playartist="${a.id}"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Tocar</button></div>
      <h2 class="sec-t">Populares</h2>${ts.map((t, i) => trackRow(t, i + 1)).join('')}
      <h2 class="sec-t">Álbuns</h2><div class="hrow">${albs.map((x) => { const f = E.byId[x.tracks[0]]; return `<div class="card" data-album="${x.id}"><div class="artw">${thumb(f, 'art')}</div><p class="ct">${esc(x.title)}</p><p class="cs">${x.year}</p></div>`; }).join('')}</div>`;
  }

  function vPlaylist(id) {
    const p = findPlaylist(id); if (!p) return vHome();
    const ts = p.tracks.map((x) => E.byId[x]).filter(Boolean);
    const total = ts.reduce((s, t) => s + (durations[t.id] || 0), 0);
    view.innerHTML = hero('Playlist', p.name, `${esc(p.desc || '')} · ${ts.length} songs${total ? ' · ' + fmt(total) : ''}`, idx((ts[0] || T[0]).id), plTheme(p)) + `
      <div class="actions"><button class="btn-play" data-playpl="${p.id}"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Tocar</button>
      ${p.id.startsWith('user-') ? `<button class="btn-ghost" data-delpl="${p.id}">Excluir</button>` : ''}</div>
      ${ts.length ? ts.map((t, i) => trackRow(t, i + 1)).join('') : `<div class="empty"><b>Playlist vazia</b>Adicione songs pelo menu ··· de qualquer faixa.</div>`}`;
  }

  function vSong(id) {
    const tr = E.byId[id]; if (!tr) return vHome();
    const al = LIB.ALBUMS.find((a) => a.id === tr.albumId);
    view.innerHTML = hero('Song', tr.title, `<b>${esc(tr.artist)}</b> · ${esc(tr.album)} · ${durations[id] != null ? fmt(durations[id]) : '—'}`, idx(id)) + `
      <div class="actions"><button class="btn-play" data-play="${id}"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Tocar</button>
      <button class="btn-ghost" data-lyrics="${id}">Ver letra</button>
      <button class="btn-ghost" data-songinfo="${id}">Detalhes</button></div>
      <h2 class="sec-t">Letra</h2><div id="songLyrics">${lyricsHtml(tr)}</div>
      ${al ? `<h2 class="sec-t">Do álbum ${esc(al.title)}</h2>${al.tracks.map((x) => E.byId[x]).map((t, i) => trackRow(t, i + 1)).join('')}` : ''}`;
  }

  function vSettings() {
    const p = E.store.prefs;
    const sw = (k, label, sub, dis) => `<div class="mrow"><div>${label}<small>${sub}</small></div><button class="switch" data-pref="${k}" aria-checked="${p[k]}" ${dis ? 'disabled' : ''} role="switch"></button></div>`;
    view.innerHTML = `<h1 class="hello">Configurações</h1><p class="sub">Áudio, reprodução e atalhos.</p>
      <h2 class="sec-t">Qualidade de áudio</h2><div id="qTiers"></div>
      <h2 class="sec-t">Reprodução</h2>
      <div class="mrow"><div>Crossfade<small>emenda real entre faixas</small></div><div class="optgrid" style="grid-template-columns:repeat(4,1fr);min-width:220px;">${[0, 2, 4, 6].map((s) => `<button data-xf="${s}" class="${p.crossfade === s ? 'on' : ''}">${s === 0 ? 'Off' : s + 's'}</button>`).join('')}</div></div>
      ${E.isIOS ? '<p class="sub">No iPhone o crossfade fica desligado de propósito: confiabilidade primeiro.</p>' : ''}
      ${sw('gapless', 'Gapless', 'próxima faixa sem intervalo', false)}
      ${sw('autoplay', 'Autoplay', 'continua tocando ao fim da fila', false)}
      ${sw('norm', 'Normalizar volume', 'exige processamento de áudio — indisponível (áudio nunca é processado)', true)}
      ${sw('explicit', 'Conteúdo explícito', 'catálogo nuwget não possui faixas explícitas', false)}
      <h2 class="sec-t">Atalhos de teclado</h2>
      <div class="kv" style="margin-bottom:20px">
        <dt>Espaço</dt><dd>Tocar / pausar</dd><dt>← / →</dt><dd>Voltar / avançar 5s (com Shift: faixa anterior / próxima)</dd>
        <dt>M</dt><dd>Mudo</dd><dt>↑ / ↓</dt><dd>Volume</dd><dt>L</dt><dd>Repetir: off → tudo → uma</dd>
      </div>
      <h2 class="sec-t">Sobre</h2><p class="sub">bearify · nuwget songs — 100% estático, sem build. Dados locais em <b>data/tracks.js</b>.</p>`;
    renderQualityTiers($('qTiers'));
  }

  async function renderQualityTiers(box) {
    if (!box) return;
    const tr = E.queue.current() || T[0];
    const sources = await E.quality.probe(tr);
    E.quality.withKbps(sources, durations[tr.id]);
    const tiers = E.quality.tiers(sources);
    const cur = E.store.prefs.quality;
    box.innerHTML = `<div class="optgrid">${tiers.map((t) => `<button data-q="${t.id}" class="${cur === t.id ? 'on' : ''}" ${t.available ? '' : 'disabled'} title="${esc(t.reason)}">${esc(t.label)}${t.available ? '' : ' · indisponível'}</button>`).join('')}</div>
      <p class="sub" style="margin:8px 0 0">Fonte real desta faixa: ${sources.map((s) => `${s.ext.toUpperCase()}${s.kbps ? ' ~' + s.kbps + ' kbps' : ''}`).join(' · ')}. Opções sem fonte ficam desativadas.</p>`;
  }

  /* ---------------- letras ---------------- */
  function lyricsHtml(tr) {
    if (!tr?.lyrics?.length) return `<div class="lyr-empty">Esta faixa ainda não tem letra sincronizada.<br>Ouça e sinta — a cena reage à música mesmo assim. 🐻</div>`;
    return tr.lyrics.map((l, i) => `<button class="lyr" data-seekto="${l.t}">${esc(l.text)}</button>`).join('');
  }
  function paintLyrics(time) {
    const tr = E.queue.current(); if (!tr?.lyrics?.length) return;
    const k = E.lyrics.active(tr, time);
    document.querySelectorAll('#npLyrics .lyr, #songLyrics .lyr').forEach((b, i) => {
      b.classList.toggle('on', i === k);
      b.classList.toggle('past', i < k);
    });
    const on = document.querySelector('#npLyrics .lyr.on');
    if (on) on.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  /* ---------------- now playing ---------------- */
  function openNP(tab = 'lyrics') {
    $('np').hidden = false;
    document.querySelectorAll('.np-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    syncNP(tab);
  }
  function syncNP(tab) {
    const tr = E.queue.current(); if (!tr) return;
    $('npTitle').textContent = tr.title; $('npArtist').textContent = tr.artist; $('npAlbum').textContent = tr.album;
    const srcs = E.quality.cache[tr.id];
    $('npQuality').textContent = srcs && srcs[0].kbps ? `${srcs[0].label} · ~${srcs[0].kbps} kbps` : 'fonte local';
    const on = E.store.isLiked(tr.id);
    $('npFav').classList.toggle('loved', on); $('npFav').setAttribute('aria-pressed', String(on));
    const active = tab || document.querySelector('.np-tabs button.on')?.dataset.tab || 'lyrics';
    $('npLyrics').hidden = active !== 'lyrics'; $('npQueue').hidden = active !== 'queue'; $('npInfo').hidden = active !== 'info';
    if (active === 'lyrics') { $('npLyrics').innerHTML = lyricsHtml(tr); paintLyrics(E.player.el.currentTime || 0); }
    if (active === 'queue') renderNPQueue();
    if (active === 'info') renderInfo($('npInfo'), tr);
  }
  function renderNPQueue() {
    const cur = E.queue.order[E.queue.idx], next = E.queue.order.slice(E.queue.idx + 1, E.queue.idx + 6);
    const item = (id, i) => { const t = E.byId[id]; return `<div class="qitem ${i === E.queue.idx ? 'cur' : ''}" data-playq="${i}">${thumb(t)}<span class="qt"><b>${esc(t.title)}</b><span>${esc(t.artist)}</span></span></div>`; };
    $('npQueue').innerHTML = `<p class="qk">Tocando agora</p>${item(cur, E.queue.idx)}<p class="qk">A seguir</p>${next.length ? next.map((id, k) => item(id, E.queue.idx + 1 + k)).join('') : '<p class="qempty">Fim da fila — ative o repeat ou o autoplay.</p>'}`;
  }
  async function renderInfo(box, tr) {
    const sources = await E.quality.probe(tr);
    E.quality.withKbps(sources, durations[tr.id]);
    box.innerHTML = `<dl class="kv">
      <dt>Título</dt><dd>${esc(tr.title)}</dd><dt>Artista</dt><dd>${esc(tr.artist)}</dd>
      <dt>Álbum</dt><dd>${esc(tr.album)} (${tr.year})</dd>
      <dt>Duração</dt><dd>${durations[tr.id] != null ? fmt(durations[tr.id]) : '—'}</dd>
      <dt>Formato</dt><dd>${sources.map((s) => s.label).join(' / ')}</dd>
      <dt>Taxa</dt><dd>${sources[0]?.kbps ? '~' + sources[0].kbps + ' kbps (estimado do arquivo real)' : '—'}</dd>
      <dt>Tamanho</dt><dd>${sources[0]?.bytes ? (sources[0].bytes / 1048576).toFixed(1) + ' MB' : '—'}</dd>
      <dt>Fonte</dt><dd>${esc(sources[0]?.url || '')}</dd></dl>`;
  }

  function setGlow(i) {
    const g = GLOW[i % GLOW.length];
    $('ambient').style.setProperty('--glow', g);
    $('npBg').style.background = `radial-gradient(70% 60% at 50% 20%, ${g}, transparent 75%)`;
  }

  /* ---------------- drawer fila ---------------- */
  function renderQueue() {
    $('queueList').innerHTML = E.queue.order.map((id, i) => { const t = E.byId[id]; return `<li class="qitem ${i === E.queue.idx ? 'cur' : ''}" draggable="true" data-qi="${i}">${thumb(t)}<span class="qt"><b>${esc(t.title)}</b><span>${esc(t.artist)}</span></span><button class="iconbtn sm" data-qrm="${i}" aria-label="remover">✕</button></li>`; }).join('');
  }

  /* ---------------- menu contexto ---------------- */
  function closeCtx() { $('ctx').hidden = true; }
  function openCtx(x, y, tr) {
    const c = $('ctx');
    const inQ = E.queue.order.includes(tr.id);
    c.innerHTML = `
      <button data-c="play">▶ Tocar agora</button>
      <button data-c="next">Tocar a seguir</button>
      <button data-c="queue">Adicionar à fila</button><hr>
      <button data-c="like">${E.store.isLiked(tr.id) ? '💚 Favoritada' : '♡ Favoritar'}</button>
      <button data-c="pl">＋ Adicionar à playlist…</button><hr>
      <button data-c="album">Ir ao álbum</button>
      <button data-c="artist">Ir ao artista</button>
      <button data-c="lyrics">Ver letra</button>
      <button data-c="info">Detalhes da faixa</button>
      <button data-c="copy">Copiar info</button>
      <button data-c="share">Compartilhar</button>`;
    c.hidden = false;
    const r = c.getBoundingClientRect();
    c.style.left = Math.min(x, innerWidth - 250) + 'px';
    c.style.top = Math.min(y, innerHeight - 380) + 'px';
    c.onclick = (e) => {
      const k = e.target.closest('button')?.dataset.c; if (!k) return;
      closeCtx(); ctxAction(k, tr);
    };
    if (inQ) c.querySelector('[data-c="queue"]').style.display = 'none';
  }
  function ctxAction(k, tr) {
    const P = E.player;
    if (k === 'play') { E.queue.set(E.queue.list, tr.id); P.load(tr, { autoplay: true }); }
    if (k === 'next') { E.queue.playNext(tr.id); toast('Toca a seguir: ' + tr.title); }
    if (k === 'queue') { E.queue.add(tr.id); toast('Na fila: ' + tr.title); }
    if (k === 'like') { const on = E.store.toggleLike(tr.id); toast(on ? 'Adicionada aos favoritos 💚' : 'Removida dos favoritos'); refreshLikes(); }
    if (k === 'pl') openAddPlaylist(tr);
    if (k === 'album') location.hash = '#/album/' + tr.albumId;
    if (k === 'artist') location.hash = '#/artist/' + tr.artistId;
    if (k === 'lyrics') openNP('lyrics');
    if (k === 'info') openSongInfo(tr);
    if (k === 'copy') navigator.clipboard?.writeText(`${tr.title} — ${tr.artist} (${tr.album})`).then(() => toast('Info copiada'));
    if (k === 'share') navigator.clipboard?.writeText(location.origin + location.pathname + '#/song/' + tr.id).then(() => toast('Link copiado'));
  }
  function refreshLikes() {
    document.querySelectorAll('[data-like]').forEach((b) => {
      const on = E.store.isLiked(b.dataset.like);
      b.classList.toggle('loved', on); b.setAttribute('aria-pressed', String(on));
    });
    const cur = E.queue.current();
    if (cur) { const on = E.store.isLiked(cur.id); $('btnFav').classList.toggle('loved', on); $('btnFav').setAttribute('aria-pressed', String(on)); }
    if ((location.hash || '').startsWith('#/library')) renderLibBody();
  }

  /* ---------------- modais ---------------- */
  function closeModal() { $('modalWrap').hidden = true; }
  function openModal(html) { $('modal').innerHTML = html; $('modalWrap').hidden = false; }
  function openSongInfo(tr) { openModal(`<button class="iconbtn mclose" data-x aria-label="fechar">✕</button><h2>${esc(tr.title)}</h2><p class="msub">${esc(tr.artist)}</p><div id="mInfo"></div>`); renderInfo($('mInfo'), tr); }
  function openQuality() {
    openModal(`<button class="iconbtn mclose" data-x aria-label="fechar">✕</button><h2>Qualidade de áudio</h2><p class="msub">Ligada às fontes reais desta faixa. Trocar preserva a posição.</p><div id="mQ"></div>`);
    renderQualityTiers($('mQ'));
  }
  function openDevices() {
    openModal(`<button class="iconbtn mclose" data-x aria-label="fechar">✕</button><h2>Dispositivos</h2><p class="msub">Saída de áudio.</p>
      <div class="mrow"><div>Este dispositivo<small>navegador — disponível</small></div><b style="color:var(--grn)">● ativo</b></div>
      <div class="mrow"><div>Volume do sistema<small>no iPhone use os botões laterais; no desktop use o slider</small></div></div>
      <div class="mrow"><div>Dispositivo externo<small>casting não suportado neste navegador</small></div><button class="btn-ghost" disabled>indisponível</button></div>`);
  }
  function openAddPlaylist(tr) {
    const ups = userPlaylists();
    openModal(`<button class="iconbtn mclose" data-x aria-label="fechar">✕</button><h2>Adicionar à playlist</h2><p class="msub">${esc(tr.title)}</p>
      ${ups.map((p) => `<div class="mrow"><div>${esc(p.name)}<small>${p.tracks.length} songs</small></div><button class="btn-ghost" data-addpl="${p.id}">adicionar</button></div>`).join('')}
      <div class="mrow"><div>Nova playlist</div><button class="btn-ghost" data-addplnew>criar</button></div>`);
    $('modal').dataset.track = tr.id;
  }

  /* ---------------- roteador ---------------- */
  function route() {
    const h = location.hash || '#/home';
    const [, r, arg] = h.split('/');
    closeCtx();
    document.querySelectorAll('#nav a, #mnav a').forEach((a) => a.classList.toggle('on', a.dataset.r === r));
    if (r === 'search') vSearch();
    else if (r === 'library') vLibrary();
    else if (r === 'album') vAlbum(arg);
    else if (r === 'artist') vArtist(arg);
    else if (r === 'playlist') vPlaylist(arg);
    else if (r === 'song') vSong(arg);
    else if (r === 'settings') vSettings();
    else vHome();
    renderSide();
    $('view').scrollTop = 0;
    view.classList.remove('enter'); void view.offsetWidth; view.classList.add('enter');
  }
  function renderSide() {
    const box = $('sidePlaylists');
    box.innerHTML = '<p class="lib-t">Playlists</p>' + allPlaylists().slice(0, 8).map((p) => `<button class="pl" data-pl="${p.id}">${plThumb(p)}<span>${esc(p.name)}</span></button>`).join('');
  }

  /* ---------------- dock ---------------- */
  let qToken = 0;
  async function syncQuality() {
    const my = ++qToken;
    const tr = E.queue.current(); if (!tr) return;
    const sources = await E.quality.probe(tr);
    if (my !== qToken) return;
    E.quality.withKbps(sources, durations[tr.id]);
    const best = sources[0]?.kbps || 0;
    const label = best >= 280 ? 'Muito alta' : best >= 140 ? 'Alta' : best > 0 ? 'Normal' : sources[0]?.label || 'HiFi';
    $('btnQuality').innerHTML = `<b>${label}</b><small>${best ? '~' + best + ' kbps' : esc(sources[0]?.ext || '')}</small>`;
  }
  function syncDock() {
    const tr = E.queue.current(); if (!tr) return;
    $('nowTitle').textContent = tr.title; $('nowArtist').textContent = tr.artist;
    const p = E.store.prefs;
    $('btnShuffle').setAttribute('aria-pressed', String(p.shuffle));
    const lp = $('btnLoop');
    lp.setAttribute('aria-pressed', String(p.repeat !== 'off'));
    lp.innerHTML = lp.innerHTML; // noop
    lp.querySelector('.one')?.remove();
    if (p.repeat === 'one') { const s = document.createElement('span'); s.className = 'one'; s.textContent = '1'; lp.appendChild(s); }
    if (!lp.querySelector('.dot') && p.repeat === 'all') { const d = document.createElement('span'); d.className = 'dot'; lp.appendChild(d); }
    const on = E.store.isLiked(tr.id);
    $('btnFav').classList.toggle('loved', on); $('btnFav').setAttribute('aria-pressed', String(on));
    const v = document.querySelector('.vol-row #vol'); if (v) v.value = (p.muted ? 0 : p.vol) * 100;
    const nv = $('npVol'); if (nv && document.activeElement !== nv) nv.value = p.vol * 100;
    $('npShuffle').setAttribute('aria-pressed', String(p.shuffle));
    $('npLoop').setAttribute('aria-pressed', String(p.repeat !== 'off'));
    setGlow(idx(tr.id));
  }

  function renderVol() {
    const w = $('npVolWrap'); if (!w) return;
    if (E.isIOS) {
      w.innerHTML = `<p class="vol-note">Volume do sistema — use os botões do iPhone 🔊</p>`;
      const dv = document.querySelector('.vol-row #vol'); if (dv) dv.outerHTML = `<span class="vol-note">volume: botões do iPhone</span>`;
    } else {
      const p = E.store.prefs;
      w.innerHTML = `<span class="vol-ic">🔈</span><input id="npVol" type="range" min="0" max="100" value="${Math.round(p.vol * 100)}" aria-label="volume do bearify"><span class="vol-ic">🔊</span>`;
      $('npVol').addEventListener('input', (e) => E.player.setVolume(e.target.value / 100));
    }
  }
  function onTick(el) {
    const d = el.duration || durations[E.queue.current()?.id] || 0, ct = el.currentTime || 0;
    const frac = d ? ct / d : 0;
    $('seek').value = frac * 1000;
    $('seekFill').style.width = frac * 100 + '%';
    $('seekHead').style.left = frac * 100 + '%';
    $('tCur').textContent = fmt(ct); $('tDur').textContent = fmt(d);
    const ns = $('npSeek'); if (ns && !$('np').hidden) { ns.value = frac * 1000; $('npSeekFill').style.width = frac * 100 + '%'; $('npSeekHead').style.left = frac * 100 + '%'; $('npCur').textContent = fmt(ct); $('npDur').textContent = fmt(d); }
    paintLyrics(ct);
    // crossfade: agenda a troca antes do fim (desligado no iOS)
    const cf = E.effCrossfade();
    if (cf > 0 && d && d - ct < cf && d - ct > 0.2 && !el.paused && !onTick._cf) { onTick._cf = true; E.player.next(true).finally(() => (onTick._cf = false)); }
    // capa grande do now playing
    const np = $('npCover');
    if (!$('np').hidden && window.Covers) window.Covers.draw(np, E.queue.current(), idx(E.queue.current().id), performance.now() / 1000);
  }

  /* ---------------- eventos globais ---------------- */
  function bind() {
    addEventListener('hashchange', route);
    document.addEventListener('click', async (e) => {
      const q = (s) => e.target.closest(s);
      let m;
      if (!e.target.closest('#ctx') && !q('[data-more]')) closeCtx();
      if ((m = q('[data-like]'))) { e.stopPropagation(); const on = E.store.toggleLike(m.dataset.like); toast(on ? 'Adicionada aos favoritos 💚' : 'Removida dos favoritos'); refreshLikes(); }
      else if ((m = q('[data-more]'))) { e.stopPropagation(); const r = m.getBoundingClientRect(); openCtx(r.left, r.bottom + 6, E.byId[m.dataset.more]); }
      else if ((m = q('[data-play]'))) { if (e.target.closest('#sres')) pushQ(searchQ); const id = m.dataset.play; if (E.queue.order.includes(id)) E.queue.idx = E.queue.order.indexOf(id); else E.queue.set(E.queue.list, id); E.player.load(E.byId[id], { autoplay: true }); openNPIfMobile(); }
      else if ((m = q('[data-playq]'))) { E.queue.idx = +m.dataset.playq; E.player.load(E.queue.current(), { autoplay: true }); }
      else if ((m = q('[data-playpl]'))) { e.stopPropagation(); const p = findPlaylist(m.dataset.playpl); E.queue.set(p.tracks, p.tracks[0]); E.player.load(E.queue.current(), { autoplay: true }); }
      else if ((m = q('[data-playalbum]'))) { const a = LIB.ALBUMS.find((x) => x.id === m.dataset.playalbum); E.queue.set(a.tracks, a.tracks[0]); E.player.load(E.queue.current(), { autoplay: true }); }
      else if ((m = q('[data-shufflealbum]'))) { const a = LIB.ALBUMS.find((x) => x.id === m.dataset.shufflealbum); E.queue.set(a.tracks, a.tracks[Math.floor(Math.random() * a.tracks.length)]); E.player.load(E.queue.current(), { autoplay: true }); }
      else if ((m = q('[data-playartist]'))) { const ts = T.filter((t) => t.artistId === m.dataset.playartist).map((t) => t.id); E.queue.set(ts, ts[0]); E.player.load(E.queue.current(), { autoplay: true }); }
      else if ((m = q('[data-pl]'))) location.hash = '#/playlist/' + m.dataset.pl;
      else if ((m = q('[data-album]'))) location.hash = '#/album/' + m.dataset.album;
      else if ((m = q('[data-gotoalbum]'))) location.hash = '#/album/' + m.dataset.gotoalbum;
      else if ((m = q('[data-artist]'))) location.hash = '#/artist/' + m.dataset.artist;
      else if ((m = q('[data-seekto]'))) E.player.el.currentTime = +m.dataset.seekto;
      else if ((m = q('[data-go]'))) location.hash = m.dataset.go;
      else if ((m = q('[data-qchip]'))) { searchQ = m.dataset.qchip; vSearch(); }
      else if ((m = q('[data-lib]'))) { libTab = m.dataset.lib; vLibrary(); }
      else if ((m = q('[data-chip]'))) { libFilter = m.dataset.chip; vLibrary(); }
      else if ((m = q('[data-newpl]'))) {
        const name = prompt('Nome da playlist:'); if (!name) return;
        const ups = userPlaylists(); const id = 'user-' + Date.now();
        ups.push({ id, name, desc: 'Criada por você.', tracks: [] }); E.store.savePlaylists(ups);
        toast('Playlist criada'); renderLibBody(); renderSide();
      }
      else if ((m = q('[data-delpl]'))) { E.store.savePlaylists(userPlaylists().filter((p) => p.id !== m.dataset.delpl)); location.hash = '#/library'; toast('Playlist excluída'); }
      else if ((m = q('[data-addpl]'))) { const ups = userPlaylists(); const p = ups.find((x) => x.id === m.dataset.addpl); p.tracks.push($('modal').dataset.track); E.store.savePlaylists(ups); closeModal(); toast('Adicionada à playlist'); }
      else if (q('[data-addplnew]')) { const name = prompt('Nome da playlist:'); if (!name) return; const ups = userPlaylists(); const id = 'user-' + Date.now(); ups.push({ id, name, desc: 'Criada por você.', tracks: [$('modal').dataset.track] }); E.store.savePlaylists(ups); closeModal(); toast('Adicionada à playlist'); }
      else if ((m = q('[data-q]'))) {
        const p = E.store.prefs; p.quality = m.dataset.q; E.store.prefs = p;
        const tr = E.queue.current();
        const srcs = E.quality.cache[tr.id] || E.quality.guess(tr);
        const pick = E.quality.pick(srcs, p.quality === 'auto' ? 'high' : p.quality === 'lossless' ? 'high' : p.quality);
        E.player.setSource(tr, pick.url, pick.type);
        closeModal(); renderQualityTiers($('qTiers')); toast('Qualidade: ' + m.dataset.q);
      }
      else if ((m = q('[data-xf]'))) { const p = E.store.prefs; p.crossfade = +m.dataset.xf; E.store.prefs = p; vSettings(); toast('Crossfade: ' + (p.crossfade ? p.crossfade + 's' : 'off')); }
      else if ((m = q('[data-pref]'))) { const p = E.store.prefs; const k = m.dataset.pref; p[k] = !p[k]; E.store.prefs = p; m.setAttribute('aria-checked', String(p[k])); }
      else if ((m = q('[data-qrm]'))) { e.stopPropagation(); E.queue.remove(+m.dataset.qrm); renderQueue(); }
      else if ((m = q('[data-x]')) || e.target.id === 'modalWrap') closeModal();
      else if ((m = q('[data-lyrics]'))) openNP('lyrics');
      else if ((m = q('[data-songinfo]'))) openSongInfo(E.byId[m.dataset.songinfo]);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeModal(); closeCtx(); $('queueDrawer').hidden = true; }
    });
    document.addEventListener('contextmenu', (e) => {
      const m = e.target.closest('[data-play]');
      if (m && E.byId[m.dataset.play]) { e.preventDefault(); openCtx(e.clientX, e.clientY, E.byId[m.dataset.play]); }
    });
    // drawer drag reorder
    let dragI = null;
    $('queueList').addEventListener('dragstart', (e) => { dragI = +e.target.closest('[data-qi]')?.dataset.qi; });
    $('queueList').addEventListener('dragover', (e) => e.preventDefault());
    $('queueList').addEventListener('drop', (e) => { const to = +e.target.closest('[data-qi]')?.dataset.qi; if (dragI != null && to != null && dragI !== to) { E.queue.move(dragI, to); renderQueue(); } });
    // seek
    const seek = $('seek');
    seek.addEventListener('input', () => E.player.seek(seek.value / 1000));
    // dock
    $('btnPlay').addEventListener('click', () => E.player.toggle());
    $('btnNext').addEventListener('click', () => E.player.next());
    $('btnPrev').addEventListener('click', () => E.player.prev());
    $('btnLoop').addEventListener('click', () => { toast('Repetir: ' + E.player.cycleRepeat()); syncDock(); });
    $('btnShuffle').addEventListener('click', () => { toast(E.player.toggleShuffle() ? 'Aleatório on' : 'Aleatório off'); syncDock(); });
    $('btnMute').addEventListener('click', () => { toast(E.player.toggleMute() ? 'Mudo' : 'Som on'); });
    $('vol').addEventListener('input', () => E.player.setVolume($('vol').value / 100));
    $('btnFav').addEventListener('click', () => { const tr = E.queue.current(); if (tr) { const on = E.store.toggleLike(tr.id); toast(on ? 'Adicionada aos favoritos 💚' : 'Removida dos favoritos'); refreshLikes(); } });
    $('npPlay').addEventListener('click', () => E.player.toggle());
    $('npNext').addEventListener('click', () => E.player.next());
    $('npPrev').addEventListener('click', () => E.player.prev());
    $('npShuffle').addEventListener('click', () => { toast(E.player.toggleShuffle() ? 'Aleatório on' : 'Aleatório off'); syncDock(); });
    $('npLoop').addEventListener('click', () => { toast('Repetir: ' + E.player.cycleRepeat()); syncDock(); });
    $('npFav').addEventListener('click', () => { const tr = E.queue.current(); if (tr) { const on = E.store.toggleLike(tr.id); toast(on ? 'Adicionada aos favoritos 💚' : 'Removida dos favoritos'); refreshLikes(); if (!$('np').hidden) syncNP(); } });
    $('npSeek').addEventListener('input', () => E.player.seek($('npSeek').value / 1000));
    $('mPlay').addEventListener('click', (e) => { e.stopPropagation(); E.player.toggle(); });
    $('mNext').addEventListener('click', (e) => { e.stopPropagation(); E.player.next(); });
    $('miniNow').addEventListener('click', () => openNP('lyrics'));
    $('btnQueue').addEventListener('click', () => { renderQueue(); $('queueDrawer').hidden = false; });
    $('queueClose').addEventListener('click', () => ($('queueDrawer').hidden = true));
    $('btnLyrics').addEventListener('click', () => openNP('lyrics'));
    $('btnQuality').addEventListener('click', openQuality);
    $('btnDevices').addEventListener('click', openDevices);
    $('btnExpand').addEventListener('click', () => openNP());
    $('coverCanvas').addEventListener('click', () => openNP());
    $('nowTitle').addEventListener('click', () => openNP());
    $('npClose').addEventListener('click', () => ($('np').hidden = true));
    $('npMore').addEventListener('click', (e) => { const r = e.target.getBoundingClientRect(); openCtx(r.left - 200, r.bottom + 6, E.queue.current()); });
    document.querySelectorAll('.np-tabs button').forEach((b) => b.addEventListener('click', () => { document.querySelectorAll('.np-tabs button').forEach((x) => x.classList.toggle('on', x === b)); $('np').classList.toggle('lyr', b.dataset.tab === 'lyrics'); syncNP(b.dataset.tab); }));
    $('npArtist').addEventListener('click', () => { $('np').hidden = true; location.hash = '#/artist/' + E.queue.current().artistId; });
    // engine events
    E.bus.on('track', () => { syncDock(); syncQuality(); renderQueue(); if (!$('np').hidden) syncNP(); });
    E.bus.on('queue', renderQueue);
    E.bus.on('status', ({ status, message }) => {
      document.body.classList.toggle('playing', status === 'playing');
      $('btnPlay').setAttribute('aria-label', status === 'playing' ? 'pausar' : 'tocar');
      if (status === 'error') {
        openModal(`<button class="iconbtn mclose" data-x aria-label="fechar">✕</button><h2>Erro de áudio</h2><p class="msub">${esc(message || 'falha ao carregar')}</p><div class="err">Verifique se o arquivo existe em <b>media/</b> e se o site está servido por http (<b>make run</b>). <b>file://</b> bloqueia áudio e análise.</div><button class="btn-play" data-x>Tentar de novo</button>`);
      }
    });
    E.bus.on('meta', ({ duration }) => { const tr = E.queue.current(); if (tr) { durations[tr.id] = duration; document.querySelectorAll(`[data-dur="${tr.id}"]`).forEach((e) => (e.textContent = fmt(duration))); } });
    E.bus.on('likes', refreshLikes);
  }

  function openNPIfMobile() { if (matchMedia('(max-width: 860px)').matches) openNP('lyrics'); }

  function init() {
    bind();
    renderVol();
    probeDurations();
    E.queue.set(T.map((t) => t.id), T[0].id);
    window.CURRENT = 0;
    route();
    E.player.load(T[0], { autoplay: false }).catch?.(() => {});
    syncDock(); renderQueue();
  }

  return { init, onTick, toast, route, openNP };
})();
