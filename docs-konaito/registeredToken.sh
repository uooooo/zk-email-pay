#!/usr/bin/env bash
set -euo pipefail

# registeredToken.sh
# Base Sepolia TokenRegistry inspector
#
# Default network: Base Sepolia
# Default registry: 0x56bd9092F8E8A6Cb89AC1e9dad9A60388D5eDC92
#
# Usage:
#   ./registeredToken.sh                  # uses defaults
#   TOKEN_REGISTRY=0x... ./registeredToken.sh
#   ./registeredToken.sh -a 0x... -r https://sepolia.base.org --json
#
# Requires: cast, jq

DEFAULT_TOKEN_REGISTRY="0x56bd9092F8E8A6Cb89AC1e9dad9A60388D5eDC92"
DEFAULT_RPC_URL="https://sepolia.base.org"

TOKEN_REGISTRY="${TOKEN_REGISTRY:-$DEFAULT_TOKEN_REGISTRY}"
RPC_URL="${RPC_URL:-${ETH_RPC_URL:-$DEFAULT_RPC_URL}}"
FROM_BLOCK="${FROM_BLOCK:-}"
OUTPUT_JSON="false"

usage() {
  cat <<USAGE
Base Sepolia TokenRegistry inspector

Usage:
  TOKEN_REGISTRY=0x... RPC_URL=... ${0##*/} [--json]
  ${0##*/} -a <token_registry_addr> -r <rpc_url> [--json]

Env/Options:
  -a, --address       TokenRegistry proxy address (default: $DEFAULT_TOKEN_REGISTRY)
  -r, --rpc-url       RPC endpoint URL (default: $DEFAULT_RPC_URL)
      --from-block    Start block number (default: auto = deploy block)
      --json          Print JSON array instead of table output
  -h, --help          Show this help
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -a|--address) TOKEN_REGISTRY="$2"; shift 2 ;;
    -r|--rpc-url) RPC_URL="$2"; shift 2 ;;
    --from-block) FROM_BLOCK="$2"; shift 2 ;;
    --json) OUTPUT_JSON="true"; shift 1 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if ! command -v cast >/dev/null 2>&1; then
  echo "Error: 'cast' not found. Install Foundry (cast)." >&2
  exit 1
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "Error: 'jq' not found. Please install jq." >&2
  exit 1
fi

if [[ -z "$TOKEN_REGISTRY" ]]; then
  echo "Error: TOKEN_REGISTRY is required." >&2
  usage; exit 1
fi

# Show chain id for confirmation
CHAIN_ID=$(cast chain-id --rpc-url "$RPC_URL" 2>/dev/null || true)
if [[ -n "$CHAIN_ID" ]]; then
  echo "RPC chain id: $CHAIN_ID (expected Base Sepolia: 84532)" >&2
else
  echo "Warning: Unable to query chain id. Proceeding..." >&2
fi

# Pull TokenRegistered logs (from genesis); we may narrow after we see earliest log
LOGS_JSON=$(cast logs --json \
  --address "$TOKEN_REGISTRY" \
  --from-block 0 --to-block latest \
  "TokenRegistered(uint256,string,address)" \
  --rpc-url "$RPC_URL" || true)

if [[ -z "$LOGS_JSON" || "$LOGS_JSON" == "null" ]]; then
  echo "No logs found or RPC returned empty response." >&2
  echo "[]" | jq '.'
  exit 0
fi

# If FROM_BLOCK is not provided, auto-set it to the earliest TokenRegistered log's block
if [[ -z "${FROM_BLOCK:-}" ]]; then
  earliest=$(echo "$LOGS_JSON" | jq -r '.logs // [] | (map(.blockNumber|tonumber) | min) // empty')
  if [[ -n "$earliest" ]]; then
    FROM_BLOCK="$earliest"
    echo "Auto-detected FROM_BLOCK (first TokenRegistered): $FROM_BLOCK" >&2
  else
    FROM_BLOCK="0"
    echo "No TokenRegistered logs found; defaulting FROM_BLOCK=0" >&2
  fi
fi

# Extract unique (chainId_hex_topic, address)
mapfile -t CID_ADDR_LIST < <(echo "$LOGS_JSON" | jq -r \
  ".logs // [] | map(select((.blockNumber|tonumber) >= ($FROM_BLOCK|tonumber))) | .[] | [(.topics[1]), (\"0x\" + (.topics[3][-40:] | ascii_downcase))] | @tsv" \
  | sort -u)

if [[ ${#CID_ADDR_LIST[@]} -eq 0 ]]; then
  echo "No TokenRegistered events found." >&2
  echo "[]" | jq '.'
  exit 0
fi

if [[ "$OUTPUT_JSON" == "true" ]]; then
  echo '['
fi

ROW=0
for item in "${CID_ADDR_LIST[@]}"; do
  cid_hex=$(echo "$item" | awk '{print $1}')
  addr=$(echo "$item" | awk '{print $2}')
  cid_dec=$(cast --to-dec "$cid_hex")
  name=$(cast call "$TOKEN_REGISTRY" \
    "getTokenNameOfAddress(uint256,address)(string)" \
    "$cid_dec" "$addr" --rpc-url "$RPC_URL" 2>/dev/null || echo "")

  if [[ "$OUTPUT_JSON" == "true" ]]; then
    [[ $ROW -gt 0 ]] && echo ','
    jq -n --arg chainId "$cid_dec" --arg address "$addr" --arg name "$name" \
      '{chainId: ($chainId|tonumber), address: $address, name: $name}'
  else
    if [[ $ROW -eq 0 ]]; then
      printf "%-10s %-42s %s\n" "CHAIN_ID" "TOKEN_ADDRESS" "NAME"
      printf "%-10s %-42s %s\n" "---------" "------------------------------------------" "----"
    fi
    printf "%-10s %-42s %s\n" "$cid_dec" "$addr" "$name"
  fi

  ROW=$((ROW+1))
done

if [[ "$OUTPUT_JSON" == "true" ]]; then
  echo ']'
fi
