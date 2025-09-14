#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
compose() { docker compose -f docker-compose.yml "$@"; }
SENDER="${SENDER:-alice@example.com}"

compose up -d mailpit
echo "[case] building image (showing logs)..."
# compose build --no-cache --progress=plain
compose run --rm test-mail event account-created "$SENDER"
