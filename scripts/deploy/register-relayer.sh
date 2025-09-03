#!/usr/bin/env bash
set -euo pipefail

# Wrapper to run upstream relayer registration script.
# Required env:
#   RPC_URL, PRIVATE_KEY, RELAYER_HANDLER, RELAYER_EMAIL, RELAYER_HOSTNAME

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
UPSTREAM_DIR="$ROOT_DIR/vendor/email-wallet/packages/contracts"

: "${RPC_URL:?RPC_URL is required}"
: "${PRIVATE_KEY:?PRIVATE_KEY is required}"
: "${RELAYER_HANDLER:?RELAYER_HANDLER is required}"
: "${RELAYER_EMAIL:?RELAYER_EMAIL is required}"
: "${RELAYER_HOSTNAME:?RELAYER_HOSTNAME is required}"

pushd "$UPSTREAM_DIR" >/dev/null
echo "Registering relayer to handler $RELAYER_HANDLER"
forge script script/RegisterRelayer.s.sol --rpc-url "$RPC_URL" --broadcast -vvv
popd >/dev/null

echo "Relayer registration submitted. Verify on-chain state and logs."
