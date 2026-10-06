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
| `index.html` | page shell, gate, player markup |
| `css/style.css` | night theme, dock, responsive |
| `js/art.js` | pixel toolkit (`Art`) + bear sprites |
| `js/world.js` | `World`: the scene, reactive to levels |
| `js/app.js` | player, analysis, waveform, lyrics, title letters |
| `data/lyrics.js` | synced lines (`t`, `end`, `text`), editable by hand |
| `media/` | `track.m4a`, `track.mp3` |
| `tools/transcribe.py` | Whisper transcription → `data/lyrics.json` |

## Run

```bash
./serve.sh   # http://localhost:8000
```

A local server is required; `file://` breaks the audio analysis and waveform.
