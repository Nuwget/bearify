# bearify

**[abrir no ar](https://nuwget.github.io/bearify/)** · <https://nuwget.github.io/bearify/>

Uma janela pixelada à noite, com chuva, o urso de fones no parapeito e a faixa tocando. A cena é desenhada em canvas sem blur nenhum e reage à música: os fogos de artifício, as janelas da cidade e o halo da lua acompanham os graves, médios e agudos.

Letra e música com IA.

## Como funciona

- **Cena** (`js/world.js`): janela, cidade em camadas com neon, fumaça e fios, chuva em três planos, parapeito molhado com poças e a lanterna que ilumina de verdade (halo, cone, poça de luz, reflexo e luz quente no urso). Tudo em pixel art nítido num canvas pequeno escalado em pixels inteiros.
- **Arte** (`js/art.js`): rasterizador de elipses sombreadas e o sprite do urso roxo com fones.
- **Player** (`js/app.js`): botão de play, voltar 10s, repetir, tela cheia, capa gerada no canvas, waveform desenhado do próprio áudio e um mini equalizador. No celular o player vira um card compacto sobre o parapeito.
- **Áudio**: a Web Audio API só analisa os níveis (bass/mid/treble); o som nunca passa por processamento.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `index.html` | página principal, player e lyrics |
| `css/style.css` | tema da noite, dock e responsivo |
| `js/world.js` | a cena pixelada reativa ao áudio |
| `js/art.js` | sprites, luzes e ferramentas de pixel art |
| `js/app.js` | player, análise, waveform e lyrics |
| `data/lyrics.js` | as linhas com `t` (começo) e `end` (fim), editáveis à mão |
| `media/` | `track.m4a` e `track.mp3` |
| `tools/transcribe.py` | gera `data/lyrics.json` com Whisper |

## Desenvolvimento

```bash
./serve.sh        # abre em http://localhost:8000
```

Servidor local é necessário: a análise de áudio e o waveform não funcionam em `file://`.

Para mudar as letras, edite `data/lyrics.js`. Para regerar a transcrição: `.venv/bin/python tools/transcribe.py`.

## GitHub Pages

No ar em **https://nuwget.github.io/bearify/**

Publicada a cada push em `main` (branch raiz). É 100% estática, sem build.

---

## English

A pixel-art night window with rain, a purple bear wearing headphones on the sill, and a track playing. The canvas scene reacts to the music (bass/mid/treble drive fireworks, city windows and the moon halo). Fully static, no build step — serve with `./serve.sh`.
