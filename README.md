# bearify

**[abrir no ar](https://nuwget.github.io/bearify/)** · <https://nuwget.github.io/bearify/>

O streaming exclusivo das songs do nuwget — **bearify · nuwget songs**. Home, busca, biblioteca, álbum, artista, playlists, fila, letra sincronizada, now playing, qualidade e configurações de áudio, com uma cena pixelada viva ao fundo (chuva, cidade e fogos reagindo aos graves/médios/agudos) e os mascotes em pixel art: o urso ao lado da marca e a lamparina na lateral.

Letra e música com IA.

## Como funciona

- **Motor** (`js/engine.js`): playback com 2 elementos de áudio (crossfade real), fila com shuffle/repeat, qualidade detectada das fontes reais (sem opção fake), letras, favoritos/playlists/recentes em `localStorage`.
- **UI** (`js/ui.js`): rotas `#/home #/search #/library #/album #/artist #/playlist #/song #/settings`, now playing com letra que acompanha a música, fila com reorder, menu de contexto, detalhes da faixa, dispositivos e qualidade.
- **Cena** (`js/world.js`): janela noturna em pixel art nítido, reativa via `window.Levels`.
- **Mascotes** (`js/mascots.js`): urso e lamparina desenhados do `Art`, piscam e balançam no grave.
- **Capas** (`js/covers.js`): uma capa pixelada animada por faixa, derivada do clima do título.
- **Áudio**: a Web Audio API só analisa os níveis (bass/mid/treble); o som nunca passa por processamento.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `index.html` | app shell: sidebar, views, dock premium, now playing, drawers, modais |
| `css/style.css` | design system, dock, now playing, mobile |
| `js/engine.js` | playback, fila, qualidade real, letras, store |
| `js/ui.js` | rotas, telas, fila, letra, menus, modais |
| `js/app.js` | bootstrap: análise, atalhos, loop |
| `js/mascots.js` | urso da marca + lamparina lateral |
| `js/covers.js` | capas pixeladas animadas por faixa |
| `js/world.js` | cena noturna reativa ao áudio |
| `data/tracks.js` | catálogo local (com letra sincronizada quando existe) |
| `data/library.js` | artista, álbum e playlists do catálogo |
| `media/` | `welcome-to-your-past.m4a`, `in-the-blue.m4a`, `just-a-little-more-time.m4a`, `silentreminante.m4a` |
| `tools/transcribe.py` | transcrição com Whisper (utilitário) |

## Desenvolvimento

```bash
./serve.sh        # abre em http://localhost:8000
make run          # atalho para o serve.sh
```

Servidor local é necessário: o áudio e a análise não funcionam em `file://`.

Para adicionar faixas, coloque os arquivos em `media/` e liste em `data/tracks.js` (com `lyrics: [{t, end, text}]` quando houver letra sincronizada).

## GitHub Pages

No ar em **https://nuwget.github.io/bearify/**

Publicada a cada push em `main` (branch raiz). É 100% estática, sem build.

---

## English

Bearify — nuwget songs' own streaming service. Home, search, library, albums, artists, playlists, queue, synced lyrics, now playing, real-source quality selector and audio settings over a live pixel-art night scene. Fully static, no build step — serve with `./serve.sh`.
