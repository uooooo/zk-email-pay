#!/usr/bin/env bash
set -euo pipefail
compose() { docker compose -f ../docker-compose.yml "$@"; }
SENDER="${SENDER:-alice@example.com}"

# stdout only（Mailpitに送らない）
compose run --rm -e SMTP_HOST= test-mail \
  render acknowledgement.html -D userEmailAddr=$SENDER -D request="Sample request"
