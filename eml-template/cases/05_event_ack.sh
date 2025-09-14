#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
compose() { docker compose -f docker-compose.yml "$@"; }
SENDER="${SENDER:-alice@example.com}"
AMOUNT="${AMOUNT:-10}"
TOKEN="${TOKEN:-TEST}"
RECIPIENT="${RECIPIENT:-bob@example.com}"

compose up -d mailpit
echo "[case] building image (showing logs)..."
# compose build --no-cache --progress=plain
compose run --rm test-mail event ack "$SENDER" "Send $AMOUNT $TOKEN to $RECIPIENT"
