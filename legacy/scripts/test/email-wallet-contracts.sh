#!/usr/bin/env bash
set -euo pipefail

# Run upstream contracts tests from this repo.
# Unit tests (no FFI) and optional integration tests (with circuits).

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
UPSTREAM_ROOT="$ROOT_DIR/email-wallet"
UPSTREAM_DIR="$UPSTREAM_ROOT/packages/contracts"

if [ ! -d "$UPSTREAM_DIR" ]; then
  echo "Upstream contracts not found: $UPSTREAM_DIR" >&2
  exit 1
fi

pushd "$UPSTREAM_ROOT" >/dev/null
if [ ! -d node_modules ]; then
  echo "Installing upstream dependencies at email-wallet (node_modules)"
  # Support nvm/nodebrew and UPSTREAM_PM override similar to deploy script
  if command -v bash >/dev/null 2>&1 && [ -s "$HOME/.nvm/nvm.sh" ]; then . "$HOME/.nvm/nvm.sh" || true; fi
  if command -v nvm >/dev/null 2>&1 && [ "${FORCE_NODE18:-1}" = "1" ]; then nvm install 18 >/dev/null 2>&1 || true; nvm use 18 || true; fi
  if command -v nodebrew >/dev/null 2>&1 && [ "${FORCE_NODE18:-1}" = "1" ]; then nodebrew use v18 >/dev/null 2>&1 || nodebrew use 18 >/dev/null 2>&1 || true; export PATH="$HOME/.nodebrew/current/bin:$PATH"; fi
  PM="${UPSTREAM_PM:-}"
  if [ -z "$PM" ]; then
    if [ -f yarn.lock ] && command -v yarn >/dev/null 2>&1; then PM=yarn; else PM=npm; fi
  fi
  echo "Installing deps with $PM"
  case "$PM" in
    yarn) YARN_IGNORE_NODE=1 yarn install || true ;;
    pnpm) pnpm i || true ;;
    npm|*) export npm_config_engine_strict=false; npm install --no-audit --no-fund --prefer-offline --ignore-scripts ;;
  esac
  [ -d node_modules ] || { echo "Install failed: node_modules not found" >&2; exit 1; }
fi
popd >/dev/null

pushd "$UPSTREAM_DIR" >/dev/null
echo "Building upstream contracts"
forge build --skip test --skip script

echo "Running unit tests (excluding integration)"
forge test --no-match-test "testIntegration" -vv

if [ "${RUN_INTEGRATION:-0}" = "1" ]; then
  echo "Running integration tests (requires circuits built and FFI)"
  forge test --match-test 'testIntegration_' -vvv --ffi
fi

popd >/dev/null
