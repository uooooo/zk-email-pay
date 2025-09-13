#!/usr/bin/env bash
set -euo pipefail

# Wrapper to run upstream email-wallet contracts deploy (local/anvil) from this repo.
# Requires submodule at email-wallet and Foundry installed.

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
UPSTREAM_ROOT="$ROOT_DIR/email-wallet"
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
  echo "Installing upstream dependencies at email-wallet (node_modules)"
  if [ "${SKIP_NPM_INSTALL:-0}" = "1" ]; then
    echo "SKIP_NPM_INSTALL=1 set; skipping install"
  else
    # Try Node 18 via nvm or nodebrew if available (upstream expects Node 18 for yarn)
    if command -v bash >/dev/null 2>&1 && [ -s "$HOME/.nvm/nvm.sh" ]; then
      # shellcheck source=/dev/null
      . "$HOME/.nvm/nvm.sh" || true
    fi
    if command -v nvm >/dev/null 2>&1; then
      if [ "${FORCE_NODE18:-1}" = "1" ]; then
        echo "Using Node 18 via nvm (FORCE_NODE18=1)"
        nvm install 18 >/dev/null 2>&1 || true
        nvm use 18 || true
      fi
    fi
    if command -v nodebrew >/dev/null 2>&1; then
      if [ "${FORCE_NODE18:-1}" = "1" ]; then
        echo "Using Node 18 via nodebrew (FORCE_NODE18=1)"
        nodebrew use v18 >/dev/null 2>&1 || nodebrew use 18 >/dev/null 2>&1 || true
        export PATH="$HOME/.nodebrew/current/bin:$PATH"
      fi
    fi
    # Choose package manager: UPSTREAM_PM overrides, else auto (yarn if yarn.lock+Node18, otherwise npm)
    PM="${UPSTREAM_PM:-}"
    if [ -z "$PM" ]; then
      if [ -f yarn.lock ] && command -v yarn >/dev/null 2>&1; then
        PM=yarn
      else
        PM=npm
      fi
    fi
    echo "Installing deps with $PM"
    case "$PM" in
      yarn)
        YARN_IGNORE_NODE=1 yarn install || true ;;
      pnpm)
        pnpm i || true ;;
      npm|*)
        export npm_config_engine_strict=false
        npm install --no-audit --no-fund --prefer-offline --ignore-scripts ;;
    esac
    [ -d node_modules ] || { echo "Install failed: node_modules not found" >&2; exit 1; }
  fi
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
