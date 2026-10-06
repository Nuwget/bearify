# AGENTS.md

Guidelines for coding agents working in this repo.

## What this is

`bearify` — a fully static pixel-art site (single canvas scene + audio player), no build step, no package manager, no dependencies. Plain HTML/CSS/JS.

## Conventions

- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `docs:`, `style:`, `chore:`, `refactor:`. Commit in small, logical parts. Messages in English, matching the style of the existing history.
- **Style**: Portuguese (pt-BR) for user-facing text and the README; English for code, comments that describe structure, and commit messages.
- **Pixel art rules**: never blur the canvas — `image-rendering: pixelated`, `shape-rendering: crispEdges`, integer scaling, no fractional blitting. All sprites are rasterized once at startup in `js/art.js`; the scene only draws them.
- **Audio**: the Web Audio API is analysis-only (bass/mid/treble levels). Never route the audible signal through an AudioContext node.
- **Mobile = website**: no PWA, no manifest, no install prompt, no bottom nav, no attempt to draw over Safari's chrome. The document scrolls; the mini player is `position: fixed` with `env(safe-area-inset-bottom)`. Mobile has its own DOM/CSS (`#m`, `css/mobile.css`, `js/mobile.js`) and shares only data/engine/lyrics with desktop. Mobile markup must not use the desktop `data-*` hooks handled in `ui.js` (`data-play`, `data-pl`, `data-about`, …); use `data-m-*`.
- **Lyrics**: one timestamp, two languages — `{t, end, pt, en}`. Never invent a missing translation; the UI shows what exists and disables the missing language.
- **Do not add** a bundler, npm, TypeScript, or a framework. Keep it openable via `python3 -m http.server`.

## Layout

| Path | What |
| --- | --- |
| `index.html` | shell: desktop (sidebar, dock, now playing, drawers, modals) + mobile root `#m` |
| `css/style.css` | desktop design system, shared lyrics styles |
| `css/mobile.css` | mobile layer (linked with `media="(max-width: 860px)"`) |
| `js/art.js` | pixel toolkit (`Art`) + bear/lamp sprites |
| `js/mascots.js` | mini bear (marca) + lamp (lateral), animados via Levels |
| `js/covers.js` | capas pixeladas animadas por faixa (`Covers`) |
| `js/world.js` | cena noturna reativa (`Levels`: fogos, janelas, halo) |
| `js/engine.js` | `Engine`: playback (2 audios p/ crossfade), fila, qualidade real, letras, store |
| `js/ui.js` | `UI` (desktop): rotas, telas, fila, now playing, menus, modais |
| `js/mobile.js` | `Mobile`: home, mini player, now playing, letra, busca, biblioteca, sheet |
| `js/lyrics.js` | `Lyrics`: letras PT/EN (render, linha ativa, scroll, idioma salvo em `bearify.lyrlang`) |
| `js/app.js` | bootstrap: tap de análise, atalhos, loop Levels+dock |
| `data/tracks.js` | catálogo local (ids, `dur`, letras sincronizadas pt/en) |
| `data/library.js` | artista, álbum e playlists derivados do catálogo |
| `tools/transcribe.py` | Whisper transcription (utility) |

## Performance

- Single RAF scheduler (`js/fx.js`): scene 60/30fps, covers 12fps, mascots ~9fps, UI 60fps; paused when tab hidden. On mobile (`FX.isMobile()`) scene, mascots, analyser and boot are off; only covers (12fps) and the mobile tick (10fps: progress + lyrics) run.
- Profiles: `full` (desktop) · `balanced` (mobile default) · `battery`; switch in Settings, stored in `bearify.perf`.
- Balanced/battery: no audio analyser (synthetic levels), less blur, fewer redraws. Audio quality untouched.
- Debug: `?debug=1` shows FPS/loops/canvas/analyser. Isolation: `?scene=off ?covers=off ?fx=off ?blur=off ?noviz`.
- Rules: no layout reads in loops, transform/opacity only, lyrics paint on line change, seek fill via `scaleX`.

## Run

```bash
./serve.sh   # http://localhost:8000
```

A local server is required; `file://` breaks the audio analysis and waveform.
