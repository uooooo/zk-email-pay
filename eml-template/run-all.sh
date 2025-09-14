#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
compose() { docker compose -f docker-compose.yml "$@"; }

# defaults
SENDER="${SENDER:-alice@example.com}"
RECIPIENT="${RECIPIENT:-bob@example.com}"
AMOUNT="${AMOUNT:-10}"
TOKEN="${TOKEN:-TEST}"

echo "[run-all] start mailpit"
compose up -d mailpit >/dev/null

echo "[run-all] build"
compose build --no-cache >/dev/null

run() { echo "[run-all] $*"; compose run --rm test-mail "$@"; }

# stdout only
compose run --rm -e SMTP_HOST= test-mail \
  render acknowledgement.html -D userEmailAddr=$SENDER -D request="Send $AMOUNT $TOKEN to $RECIPIENT" >/dev/null

run api create-new $SENDER
run api create-existing $SENDER
run api send $SENDER $AMOUNT $TOKEN $RECIPIENT
run api recover $SENDER
run event ack $SENDER "Send $AMOUNT $TOKEN to $RECIPIENT"
run event account-created $SENDER
run event voided $SENDER

echo "[run-all] done -> http://localhost:8025"

