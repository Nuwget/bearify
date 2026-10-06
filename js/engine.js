/* bearify · motor de reprodução.
   PlaybackEngine (2 <audio> p/ crossfade real) · QueueManager · QualityManager
   (detecta fontes reais) · LyricsManager · Store (localStorage).
   O som nunca passa por WebAudio; a análise de Levels continua só-leitura em app.js. */
window.Engine = (() => {
  const T = window.TRACKS;
  const byId = Object.fromEntries(T.map((t) => [t.id, t]));
  const $ = (id) => document.getElementById(id);

  /* ---------------- Store: prefs + favoritos + playlists + recentes ---------------- */
  const DEF = { vol: 0.85, muted: false, repeat: 'off', shuffle: false, quality: 'auto', gapless: true, crossfade: 0, autoplay: true, norm: false, explicit: true };
  const store = {
    get prefs() { try { return { ...DEF, ...JSON.parse(localStorage.getItem('bearify.prefs') || '{}') }; } catch { return { ...DEF }; } },
    set prefs(p) { localStorage.setItem('bearify.prefs', JSON.stringify(p)); },
    get likes() { try { return JSON.parse(localStorage.getItem('bearify.likes') || '[]'); } catch { return []; } },
    toggleLike(id) { const l = new Set(this.likes); l.has(id) ? l.delete(id) : l.add(id); localStorage.setItem('bearify.likes', JSON.stringify([...l])); bus.emit('likes'); return l.has(id); },
    isLiked(id) { return this.likes.includes(id); },
    get playlists() { try { return JSON.parse(localStorage.getItem('bearify.playlists') || 'null') || null; } catch { return null; } },
    savePlaylists(p) { localStorage.setItem('bearify.playlists', JSON.stringify(p)); },
    pushRecent(id) { try { const r = [id, ...JSON.parse(localStorage.getItem('bearify.recent') || '[]').filter((x) => x !== id)].slice(0, 12); localStorage.setItem('bearify.recent', JSON.stringify(r)); } catch {} },
    get recent() { try { return JSON.parse(localStorage.getItem('bearify.recent') || '[]').filter((id) => byId[id]); } catch { return []; } },
  };

  /* ---------------- event bus ---------------- */
  const bus = { m: {}, on(e, f) { (this.m[e] = this.m[e] || []).push(f); }, emit(e, d) { (this.m[e] || []).forEach((f) => f(d)); } };

  /* ---------------- QualityManager: fontes reais ---------------- */
  // Detecta o que existe de verdade: tenta HEAD em .m4a e .mp3, mede bytes e
  // estima kbps com a duração real. Opções sem fonte ficam desativadas na UI.
  const quality = {
    cache: {},
    async probe(track) {
      if (this.cache[track.id]) return this.cache[track.id];
      const out = [];
      for (const [ext, type, label] of [['m4a', 'audio/mp4', 'AAC'], ['mp3', 'audio/mpeg', 'MP3']]) {
        const url = `${track.base}.${ext}`;
        try {
          const h = await fetch(url, { method: 'HEAD' });
          if (!h.ok) continue;
          const bytes = +(h.headers.get('content-length') || 0);
          out.push({ url, type, ext, label, bytes, kbps: 0 });
        } catch { /* offline ou file://: ignora */ }
      }
      // fallback: se HEAD falhar (file://), assume as URLs e deixa o <audio> tentar
      if (!out.length) out.push({ url: `${track.base}.m4a`, type: 'audio/mp4', ext: 'm4a', label: 'AAC', bytes: 0, kbps: 0 });
      return (this.cache[track.id] = out);
    },
    withKbps(sources, seconds) { sources.forEach((s) => { if (s.bytes && seconds) s.kbps = Math.round((s.bytes * 8) / seconds / 1000); }); return sources; },
    // pref auto/high -> maior kbps (ou primeira); normal/low -> menor
    pick(sources, pref) {
      const s = [...sources];
      if (pref === 'low' || pref === 'normal') s.sort((a, b) => a.kbps - b.kbps);
      else s.sort((a, b) => b.kbps - a.kbps);
      return s[0];
    },
    tiers(sources) {
      const have = new Set(sources.map((s) => s.ext));
      const best = Math.max(0, ...sources.map((s) => s.kbps || 0));
      const tier = (id, label, need, minKbps) => ({
        id, label,
        available: need === null ? true : have.has(need) && (minKbps == null || best >= minKbps - 60),
        reason: need !== null && !have.has(need) ? 'sem fonte neste formato' : minKbps != null && best < minKbps - 60 ? `fonte máxima ~${best || '?'} kbps` : '',
      });
      return [
        tier('auto', 'Automática', null),
        tier('normal', 'Normal · ~96 kbps', null),
        tier('high', 'Alta · ~160 kbps', null),
        tier('veryhigh', 'Muito alta · ~320 kbps', null),
        tier('lossless', 'Lossless · FLAC', 'flac'),
      ];
    },
  };

  /* ---------------- QueueManager ---------------- */
  const queue = {
    list: T.map((t) => t.id),
    order: T.map((t) => t.id),
    idx: 0,
    set(ids, startId) {
      this.list = [...ids];
      this.order = store.prefs.shuffle ? shuffled(this.list) : [...this.list];
      this.idx = Math.max(0, this.order.indexOf(startId ?? this.order[0]));
      bus.emit('queue');
    },
    current() { return byId[this.order[this.idx]]; },
    next(auto = false) {
      const p = store.prefs;
      if (p.repeat === 'one' && !auto) return this.current();
      if (this.idx + 1 < this.order.length) { this.idx++; bus.emit('queue'); return this.current(); }
      if (p.repeat === 'all' || (auto && p.autoplay)) { this.idx = 0; if (p.shuffle) this.order = shuffled(this.list); bus.emit('queue'); return this.current(); }
      return null;
    },
    prev() { if (this.idx > 0) { this.idx--; bus.emit('queue'); } return this.current(); },
    move(from, to) { const [x] = this.order.splice(from, 1); this.order.splice(to, 0, x); if (from === this.idx) this.idx = to; else if (from < this.idx && to >= this.idx) this.idx--; else if (from > this.idx && to <= this.idx) this.idx++; bus.emit('queue'); },
    remove(i) { if (this.order.length <= 1) return; this.order.splice(i, 1); if (i < this.idx) this.idx--; else if (i === this.idx) this.idx = Math.min(this.idx, this.order.length - 1); bus.emit('queue'); },
    playNext(id) { this.order.splice(this.idx + 1, 0, id); this.list.splice(this.list.indexOf(this.current()?.id) + 1, 0, id); bus.emit('queue'); },
    add(id) { this.order.push(id); this.list.push(id); bus.emit('queue'); },
    reshuffle() { const cur = this.order[this.idx]; this.order = store.prefs.shuffle ? [cur, ...shuffled(this.order.filter((x) => x !== cur))] : [...this.list]; this.idx = this.order.indexOf(cur); bus.emit('queue'); },
  };
  function shuffled(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  /* ---------------- PlaybackEngine: 2 elementos p/ crossfade real ---------------- */
  const els = [new Audio(), new Audio()];
  els.forEach((a) => { a.preload = 'auto'; a.playsInline = true; });
  let active = 0, wantPlay = false, status = 'idle', fadeTimer = null, switchHandler = null;
  const A = () => els[active], B = () => els[1 - active];

  const player = {
    get status() { return status; },
    get el() { return A(); },
    get track() { return queue.current(); },
    setStatus(s, extra) { status = s; bus.emit('status', { status: s, ...extra }); },
    async load(track, { autoplay = true, keepPos = false } = {}) {
      const pos = keepPos ? A().currentTime : 0;
      const prefs = store.prefs;
      const sources = await quality.probe(track);
      const pick = quality.pick(sources, prefs.quality === 'auto' ? 'high' : prefs.quality === 'lossless' ? 'high' : prefs.quality);
      const el = A();
      el.innerHTML = '';
      // garante a escolhida primeiro
      el.innerHTML = '';
      [pick, ...sources.filter((s) => s.url !== pick.url)].forEach((s) => { const sc = document.createElement('source'); sc.src = s.url; sc.type = s.type; el.appendChild(sc); });
      el.load();
      this.setStatus('loading');
      window.CURRENT = T.indexOf(track);
      store.pushRecent(track.id);
      bus.emit('track', track);
      if (pos) el.currentTime = pos;
      // completa kbps quando a duração chegar
      el.onloadedmetadata = () => { quality.withKbps(sources, el.duration); bus.emit('meta', { track, duration: el.duration, sources }); };
      if (autoplay || wantPlay) this.play();
    },
    play() {
      wantPlay = true;
      const el = A();
      if (el.readyState < 2) this.setStatus('loading');
      el.volume = store.prefs.muted ? 0 : store.prefs.vol;
      el.play().catch((e) => this.setStatus('error', { message: e.name }));
    },
    pause() { wantPlay = false; A().pause(); },
    toggle() { A().paused ? this.play() : this.pause(); },
    seek(frac) { const el = A(); if (el.duration) el.currentTime = frac * el.duration; },
    seekBy(d) { const el = A(); el.currentTime = Math.min(Math.max(0, el.currentTime + d), el.duration || 0); },
    setVolume(v) { const p = store.prefs; p.vol = Math.min(1, Math.max(0, v)); store.prefs = p; els.forEach((e) => (e.volume = p.muted ? 0 : p.vol)); bus.emit('vol'); },
    toggleMute() { const p = store.prefs; p.muted = !p.muted; store.prefs = p; els.forEach((e) => (e.volume = p.muted ? 0 : p.vol)); bus.emit('vol'); return p.muted; },
    cycleRepeat() { const p = store.prefs; p.repeat = p.repeat === 'off' ? 'all' : p.repeat === 'all' ? 'one' : 'off'; store.prefs = p; bus.emit('mode'); return p.repeat; },
    toggleShuffle() { const p = store.prefs; p.shuffle = !p.shuffle; store.prefs = p; queue.reshuffle(); bus.emit('mode'); return p.shuffle; },
    async next(auto = false) {
      if (store.prefs.repeat === 'one' && !auto) { A().currentTime = 0; this.play(); return; }
      const t = queue.next(auto);
      if (!t) { wantPlay = false; bus.emit('status', { status: 'paused' }); return; }
      const cf = store.prefs.crossfade;
      if (auto && cf > 0 && !A().paused) return this._crossfade(t, cf);
      await this.load(t, { autoplay: wantPlay || auto });
    },
    async prev() {
      if (A().currentTime > 3) { A().currentTime = 0; return; }
      const t = queue.prev();
      if (t) await this.load(t, { autoplay: true });
    },
    // crossfade real: o próximo começa no 2º elemento enquanto o atual esvanece
    async _crossfade(track, secs) {
      const old = A(), nxt = B();
      const sources = await quality.probe(track);
      const pick = quality.pick(sources, 'high');
      nxt.innerHTML = ''; const sc = document.createElement('source'); sc.src = pick.url; sc.type = pick.type; nxt.appendChild(sc);
      nxt.volume = 0; nxt.currentTime = 0;
      window.CURRENT = T.indexOf(track); store.pushRecent(track.id); bus.emit('track', track);
      queue; // índice já avançado por queue.next()
      try { await nxt.play(); } catch { return this.load(track, { autoplay: true }); }
      const steps = 20, dt = (secs * 1000) / steps, v0 = store.prefs.muted ? 0 : store.prefs.vol;
      let i = 0;
      clearInterval(fadeTimer);
      fadeTimer = setInterval(() => {
        i++;
        nxt.volume = Math.min(v0, (v0 * i) / steps);
        old.volume = Math.max(0, v0 * (1 - i / steps));
        if (i >= steps) { clearInterval(fadeTimer); old.pause(); old.volume = v0; active = 1 - active; this._wire(A()); }
      }, dt);
    },
    // re-liga eventos no elemento que passou a ser o ativo
    _wire(el) { wireEvents(el); },
  };

  function wireEvents(el) {
    el.onwaiting = () => player.setStatus('buffering');
    el.onstalled = () => player.setStatus('buffering');
    el.onplaying = () => { player.setStatus('playing'); if ('mediaSession' in navigator && queue.current()) { const t = queue.current(); navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist, album: t.album }); } };
    el.onpause = () => { if (!fadeTimer || !switchHandler) player.setStatus(A().ended ? status : 'paused'); };
    el.oncanplay = () => { if (status === 'loading' || status === 'buffering') player.setStatus(A().paused ? 'paused' : 'playing'); };
    el.onerror = () => player.setStatus('error', { message: 'falha ao carregar o áudio' });
    el.onended = () => {
      // gapless: sem intervalo, já prepara o próximo
      if (store.prefs.crossfade > 0) return; // crossfade agenda antes do fim (ver tick)
      player.next(true);
    };
  }
  els.forEach(wireEvents);

  /* ---------------- LyricsManager ---------------- */
  const lyrics = {
    active(track, time) {
      if (!track?.lyrics?.length) return -1;
      let k = -1;
      track.lyrics.forEach((l, i) => { if (time >= l.t) k = i; });
      return k;
    },
  };

  return { store, bus, quality, queue, player, lyrics, byId, fmt: (s) => { s = Math.max(0, Math.floor(isFinite(s) ? s : 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; } };
})();
