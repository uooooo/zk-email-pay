#!/usr/bin/env bash
set -euo pipefail

# Wrapper to run upstream email-wallet contracts deploy (local/anvil) from this repo.
# Requires submodule at vendor/email-wallet and Foundry installed.

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
UPSTREAM_ROOT="$ROOT_DIR/vendor/email-wallet"
UPSTREAM_DIR="$UPSTREAM_ROOT/packages/contracts"

if [ ! -d "$UPSTREAM_DIR" ]; then
  echo "Upstream contracts not found: $UPSTREAM_DIR" >&2
  exit 1
fi

RPC_URL="${RPC_URL:-http://127.0.0.1:8545}"
CHAIN_ID="${CHAIN_ID:-31337}"

echo "Using RPC_URL=$RPC_URL CHAIN_ID=$CHAIN_ID"

pushd "$UPSTREAM_ROOT" >/dev/null

# Ensure node_modules at monorepo root (contracts import from ../../node_modules)
if [ ! -d node_modules ]; then
  echo "Installing upstream dependencies at vendor/email-wallet (node_modules)"
  # Prefer npm to avoid yarn engine strict errors; disable engine-strict
  npm_config_engine_strict=false npm install
fi

popd >/dev/null

pushd "$UPSTREAM_DIR" >/dev/null

# Upstream expects .env; create if missing.
if [ ! -f .env ]; then
  if [ -f .env.sample ]; then
    cp .env.sample .env
  else
    touch .env
  fi
fi

echo "Running upstream DefaultSetupScript (this will deploy TokenRegistry/DKIM/Verifiers/Handlers/Core)"
forge script script/DefaultSetupScript.s.sol:Deploy \
  --rpc-url "$RPC_URL" \
  --chain-id "$CHAIN_ID" \
  --broadcast -vvv

popd >/dev/null

echo "NOTE: Deployed addresses are in the upstream broadcast logs."
echo "Action: Copy relevant addresses into contracts/addresses/<network>.json as needed."
