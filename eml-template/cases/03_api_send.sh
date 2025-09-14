#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
compose() { docker compose -f docker-compose.yml "$@"; }
SENDER="${SENDER:-alice@example.com}"
RECIPIENT="${RECIPIENT:-bob@example.com}"
AMOUNT="${AMOUNT:-10}"
TOKEN="${TOKEN:-TEST}"

compose up -d mailpit
echo "[case] building image (showing logs)..."
# compose build --no-cache --progress=plain
if [ -n "${RELAYER_EMAIL:-}" ]; then
  compose run --rm -e RELAYER_EMAIL="$RELAYER_EMAIL" test-mail api send "$SENDER" "$AMOUNT" "$TOKEN" "$RECIPIENT"
else
  compose run --rm test-mail api send "$SENDER" "$AMOUNT" "$TOKEN" "$RECIPIENT"
fi
