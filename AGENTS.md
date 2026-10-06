# AGENTS.md

Guidelines for coding agents working in this repo.

## What this is

`bearify` — a fully static pixel-art site (single canvas scene + audio player), no build step, no package manager, no dependencies. Plain HTML/CSS/JS.

## Conventions

- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `docs:`, `style:`, `chore:`, `refactor:`. Commit in small, logical parts. Messages in English, matching the style of the existing history.
- **Style**: Portuguese (pt-BR) for user-facing text and the README; English for code, comments that describe structure, and commit messages.
- **Pixel art rules**: never blur the canvas — `image-rendering: pixelated`, `shape-rendering: crispEdges`, integer scaling, no fractional blitting. All sprites are rasterized once at startup in `js/art.js`; the scene only draws them.
- **Audio**: the Web Audio API is analysis-only (bass/mid/treble levels). Never route the audible signal through an AudioContext node.
- **Do not add** a bundler, npm, TypeScript, or a framework. Keep it openable via `python3 -m http.server`.

## Layout

| Path | What |
| --- | --- |
| `index.html` | app shell: sidebar, views, premium dock, now playing, drawers, modals |
| `css/style.css` | design system, dock, now playing, mobile |
| `js/art.js` | pixel toolkit (`Art`) + bear/lamp sprites |
| `js/mascots.js` | mini bear (marca) + lamp (lateral), animados via Levels |
| `js/covers.js` | capas pixeladas animadas por faixa (`Covers`) |
| `js/world.js` | cena noturna reativa (`Levels`: fogos, janelas, halo) |
| `js/engine.js` | `Engine`: playback (2 audios p/ crossfade), fila, qualidade real, letras, store |
| `js/ui.js` | `UI`: rotas, telas, fila, letra sincronizada, menus, modais |
| `js/app.js` | bootstrap: tap de análise, atalhos, loop Levels+dock |
| `data/tracks.js` | catálogo local (ids, letras sincronizadas) |
| `data/library.js` | artista, álbum e playlists derivados do catálogo |
| `tools/transcribe.py` | Whisper transcription (utility) |

## Performance

- Single RAF scheduler (`js/fx.js`): scene 60/30fps, covers 12fps, mascots ~9fps, UI 60fps; paused when tab hidden.
- Profiles: `full` (desktop) · `balanced` (mobile default) · `battery`; switch in Settings, stored in `bearify.perf`.
- Balanced/battery: no audio analyser (synthetic levels), less blur, fewer redraws. Audio quality untouched.
- Debug: `?debug=1` shows FPS/loops/canvas/analyser. Isolation: `?scene=off ?covers=off ?fx=off ?blur=off ?noviz`.
- Rules: no layout reads in loops, transform/opacity only, lyrics paint on line change, seek fill via `scaleX`.

## Run

```bash
./serve.sh   # http://localhost:8000
```

A local server is required; `file://` breaks the audio analysis and waveform.
