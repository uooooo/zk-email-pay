#!/usr/bin/env bash
set -euo pipefail

# Run upstream contracts tests from this repo.
# Unit tests (no FFI) and optional integration tests (with circuits).

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
UPSTREAM_ROOT="$ROOT_DIR/vendor/email-wallet"
UPSTREAM_DIR="$UPSTREAM_ROOT/packages/contracts"

if [ ! -d "$UPSTREAM_DIR" ]; then
  echo "Upstream contracts not found: $UPSTREAM_DIR" >&2
  exit 1
fi

pushd "$UPSTREAM_ROOT" >/dev/null
if [ ! -d node_modules ]; then
  echo "Installing upstream dependencies at vendor/email-wallet (node_modules)"
  npm_config_engine_strict=false npm install
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
