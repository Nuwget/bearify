/* Player, faixas locais, análise de áudio (Levels), equalizador. */
(() => {
  const $ = (id) => document.getElementById(id);
  const audio = $('audio');
  const body = document.body;
  const L = (window.Levels = window.Levels || { bass: 0, mid: 0, treble: 0 });
  const fmt = (s) => { s = Math.max(0, Math.floor(isFinite(s) ? s : 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

  const TRACKS = window.TRACKS || [];
  let current = -1;

  function toast(msg, ms = 4200) {
    const t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), ms);
  }

  /* ---------- web audio (só análise; o som nunca passa por processamento) ---------- */
  const canAnalyse = /^https?:$/.test(location.protocol);
  let actx = null, analyser = null, freq = null, bins = null;
  function setupAnalyser() {
    if (!canAnalyse || actx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      actx = new AC({ latencyHint: 'playback' });
      const src = actx.createMediaElementSource(audio);
      analyser = actx.createAnalyser();
      analyser.fftSize = 2048; analyser.smoothingTimeConstant = 0.8;
      src.connect(analyser); src.connect(actx.destination);
      freq = new Uint8Array(analyser.frequencyBinCount);
      const hz = actx.sampleRate / analyser.fftSize, b = (f) => Math.max(1, Math.round(f / hz));
      bins = { b0: b(35), b1: b(150), m0: b(250), m1: b(2000), t0: b(4000), t1: b(12000) };
      actx.resume();
    } catch (e) { actx = null; analyser = null; }
  }

  let quiet = 0;
  function readLevels(t) {
    const playing = !audio.paused && !audio.ended;
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

  /* ---------- faixas ---------- */
  const listEl = $('trackList').querySelector('tbody');
  TRACKS.forEach((tr, i) => {
    const row = document.createElement('tr');
    row.innerHTML = `<td class="num">${i + 1}</td><td class="t"><b>${tr.title}</b><br><span style="color:#9a9ab0;font-size:12px">${tr.artist}</span></td><td style="color:#9a9ab0">${tr.album}</td><td class="dur">—</td>`;
    row.addEventListener('click', () => load(i).then(play));
    listEl.appendChild(row);
  });
  document.querySelector('[data-play-first]').addEventListener('click', (e) => { e.preventDefault(); load(0).then(play); });

  function load(i) {
    current = i;
    const tr = TRACKS[i];
    audio.innerHTML = `<source src="${tr.base}.m4a" type='audio/mp4; codecs="opus"'><source src="${tr.base}.mp3" type="audio/mpeg">`;
    audio.load();
    $('nowTitle').textContent = tr.title;
    $('nowArtist').textContent = tr.artist;
    listEl.querySelectorAll('tr').forEach((r, j) => r.classList.toggle('on', j === i));
    if ('mediaSession' in navigator) navigator.mediaSession.metadata = new MediaMetadata({ title: tr.title, artist: tr.artist, album: tr.album });
    return new Promise((res) => audio.addEventListener('canplay', res, { once: true }));
  }

  if (TRACKS.length) { load(0); }

  /* ---------- transport ---------- */
  function play() {
    if (actx && actx.state === 'suspended') actx.resume();
    setupAnalyser();
    const p = audio.play();
    if (p && p.catch) p.catch((e) => toast('Não consegui tocar o áudio (' + e.name + '). Clique em play de novo.'));
  }
  const toggle = () => (audio.paused ? play() : audio.pause());
  $('btnPlay').addEventListener('click', toggle);
  $('btnBack').addEventListener('click', () => { audio.currentTime = Math.max(0, audio.currentTime - 10); });
  $('btnFwd').addEventListener('click', () => { audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10); });
  $('btnLoop').addEventListener('click', (e) => { audio.loop = !audio.loop; e.currentTarget.setAttribute('aria-pressed', String(audio.loop)); });
  $('btnFs').addEventListener('click', () => { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); });

  const vol = $('vol');
  const setVol = (v) => { audio.volume = Math.min(1, Math.max(0, v)); vol.value = audio.volume * 100; };
  vol.addEventListener('input', () => setVol(vol.value / 100)); setVol(0.85);

  const seek = $('seek');
  let seeking = false;
  seek.addEventListener('input', () => { seeking = true; if (audio.duration) audio.currentTime = (seek.value / 1000) * audio.duration; });
  seek.addEventListener('change', () => { seeking = false; });

  audio.addEventListener('play', () => { body.classList.add('playing'); $('btnPlay').setAttribute('aria-label', 'pausar'); });
  audio.addEventListener('pause', () => { body.classList.remove('playing'); $('btnPlay').setAttribute('aria-label', 'tocar'); });
  const dur = () => { $('tDur').textContent = fmt(audio.duration); };
  audio.addEventListener('loadedmetadata', dur); audio.addEventListener('durationchange', dur);
  audio.addEventListener('ended', () => { if (current + 1 < TRACKS.length) load(current + 1).then(play); });
  audio.addEventListener('error', () => toast('Erro ao carregar o áudio. Abra por um servidor: ./serve.sh', 8000));

  addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' && e.target.type !== 'range') return;
    if (e.code === 'Space') { e.preventDefault(); toggle(); }
    else if (e.code === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - 5);
    else if (e.code === 'ArrowRight') audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
    else if (e.code === 'ArrowUp') { e.preventDefault(); setVol(audio.volume + 0.05); }
    else if (e.code === 'ArrowDown') { e.preventDefault(); setVol(audio.volume - 0.05); }
  });

  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', play);
    navigator.mediaSession.setActionHandler('pause', () => audio.pause());
    navigator.mediaSession.setActionHandler('seekbackward', () => { audio.currentTime -= 10; });
    navigator.mediaSession.setActionHandler('seekforward', () => { audio.currentTime += 10; });
  }

  /* ---------- equalizador ---------- */
  const eq = $('eq'), ectx = eq.getContext('2d');
  function drawEq(t) {
    ectx.clearRect(0, 0, 14, 7);
    const on = !audio.paused && !audio.ended;
    for (let i = 0; i < 4; i++) {
      const band = i < 2 ? L.bass : i === 2 ? L.mid : L.treble;
      const h = on ? Math.max(1, Math.min(7, Math.round(1 + band * 5 + (Math.sin(t * (5 + i * 1.7) + i * 2) + 1) * 0.9))) : 1;
      ectx.fillStyle = '#1ed760'; ectx.fillRect(i * 3 + 1, 7 - h, 2, h);
    }
  }

  let lastT = -1;
  function tick(now) {
    const t = now / 1000;
    readLevels(t);
    const d = audio.duration || 0, ct = audio.currentTime, p = d ? ct / d : 0;
    if (!seeking) seek.value = p * 1000;
    const s = Math.floor(ct);
    if (s !== lastT) { lastT = s; $('tCur').textContent = fmt(ct); }
    drawEq(t);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
