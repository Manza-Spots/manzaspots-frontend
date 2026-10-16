#!/bin/sh
# Expone la API local (Docker, puerto 8000) en el dominio fijo de ngrok de .env.staging.
# caffeinate mantiene la Mac despierta mientras el túnel esté abierto: si se duerme,
# el túnel se cae a mitad de una ruta grabada.
set -e
cd "$(dirname "$0")/.."

DOMAIN=$(sed -n 's/^NGROK_DOMAIN=//p' .env.staging 2>/dev/null)
if [ -z "$DOMAIN" ]; then
  echo "Falta NGROK_DOMAIN en .env.staging (copia .env.staging.example)." >&2
  exit 1
fi

if ! curl -s -o /dev/null --max-time 3 http://localhost:8000/; then
  echo "La API no responde en localhost:8000; levanta el Docker del backend primero." >&2
  exit 1
fi

echo "API pública en https://$DOMAIN/api/v1/ (Ctrl+C para cerrar)"
exec caffeinate -dims ngrok http 8000 --url="https://$DOMAIN"
