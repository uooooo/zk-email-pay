#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
compose() { docker compose -f docker-compose.yml "$@"; }
SENDER="${SENDER:-alice@example.com}"

compose up -d mailpit
echo "[case] building image (showing logs)..."
# compose build --no-cache --progress=plain
if [ -n "${RELAYER_EMAIL:-}" ]; then
  compose run --rm -e RELAYER_EMAIL="$RELAYER_EMAIL" test-mail api create-new "$SENDER"
else
  compose run --rm test-mail api create-new "$SENDER"
fi
