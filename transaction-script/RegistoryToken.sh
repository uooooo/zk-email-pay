#!/usr/bin/env bash
set -euo pipefail

# TokenRegistry にトークンを登録するための cast コマンド
# - Base Sepolia 固定（必要なら環境変数で上書き可）
# - 秘密鍵は環境変数 PRIVATE_KEY から取得
#
# 使い方（オプション不要）
# 1) 下の PAIRS にペアを記述（SYMBOL:ADDRESS）
# 2) export PRIVATE_KEY=0x...（レジストリ owner の鍵）
# 3) このスクリプトを実行

# REG=${REG:-0x56bd9092F8E8A6Cb89AC1e9dad9A60388D5eDC92}
REG=${REG:-0xdED4f222098151832E083BAAAAAA7A35C13D7243}
RPC=${RPC:-https://sepolia.base.org}
CHAIN=${CHAIN:-84532}

PRIVATE_KEY=${PRIVATE_KEY:?env PRIVATE_KEY is required}

# 登録したいペア（オプション不要）
PAIRS=(
  "USDC:0x3CA50b9B421646D0B485852A14168Aa8494D2877"
  "JPYC:0x36e3495B2AeC55647bEF00968507366f1f7572C6"
)

SENDER=$(cast wallet address --private-key "$PRIVATE_KEY")
nonce=$(cast nonce "$SENDER" --rpc-url "$RPC" --block pending)

for pair in "${PAIRS[@]}"; do
  sym=${pair%%:*}
  addr=${pair#*:}
  echo "Registering $sym -> $addr on chain $CHAIN (nonce=$nonce)"
  cast send "$REG" 'setTokenAddress(uint256,string,address)' \
    "$CHAIN" "$sym" "$addr" \
    --rpc-url "$RPC" \
    --private-key "$PRIVATE_KEY" \
    --nonce "$nonce"
  nonce=$((nonce+1))
done

echo "Done."
