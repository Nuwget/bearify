#!/usr/bin/env bash
# Servidor local com byte-range (o Safari/iOS exige 206 para tocar áudio).
cd "$(dirname "$0")"
PORT="${1:-8000}"
( sleep 1; xdg-open "http://localhost:$PORT" >/dev/null 2>&1 ) &
exec python3 tools/serve.py "$PORT"
