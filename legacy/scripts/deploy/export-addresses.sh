#!/usr/bin/env bash
set -euo pipefail

# Export deployed addresses from upstream forge broadcast JSON into contracts/addresses/<network>.json
# Usage:
#   CHAIN_ID=31337 NETWORK=local scripts/deploy/export-addresses.sh
#   or: scripts/deploy/export-addresses.sh 31337 local

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
UPSTREAM_BROADCAST_BASE="$ROOT_DIR/vendor/email-wallet/packages/contracts/broadcast/DefaultSetupScript.s.sol"

CHAIN_ID="${1:-${CHAIN_ID:-}}"
NETWORK="${2:-${NETWORK:-}}"

if [ -z "${CHAIN_ID}" ]; then
  echo "CHAIN_ID is required (arg1 or env)" >&2
  exit 1
fi

if [ -z "${NETWORK:-}" ]; then
  case "$CHAIN_ID" in
    31337) NETWORK=local ;;
    84532) NETWORK=base-sepolia ;;
    *) NETWORK="chain-$CHAIN_ID" ;;
  esac
fi

RUN_JSON="$UPSTREAM_BROADCAST_BASE/$CHAIN_ID/run-latest.json"
if [ ! -f "$RUN_JSON" ]; then
  echo "Broadcast JSON not found: $RUN_JSON" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required" >&2
  exit 1
fi

OUT_DIR="$ROOT_DIR/addresses"
mkdir -p "$OUT_DIR"
OUT_FILE="$OUT_DIR/$NETWORK.json"

# Build a { ContractName: address, ... } object from CREATE transactions having contractAddress
jq 'reduce ( .transactions[] | select(.transactionType=="CREATE" and .contractAddress != null and .contractName != null) | { (.contractName): .contractAddress } ) as $i ({}; . * $i)' "$RUN_JSON" > "$OUT_FILE"

echo "Wrote addresses to $OUT_FILE"
