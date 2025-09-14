---
marp: true
title: TokenRegistry に JPYC を追加する手順
description: Email Wallet の TokenRegistry へ JPYC を登録するための実務ガイド
paginate: true
theme: default
class: lead
---

# JPYC 登録ガイド（TokenRegistry）

- 対象: コントラクト管理者（TokenRegistry オーナー）
- 前提: Foundry(forge/cast), 環境変数に `PRIVATE_KEY`/`RPC_URL` 等を設定
- 重要: ユーザー手数料は ETH/WETH/DAI/USDC のみ（JPYC では支払不可）

---

## 目的と前提

- 目的: Email Wallet で「JPYC」を送金・スワップ等に使えるようにする
- 方法: `TokenRegistry` にシンボル名とアドレスを登録
- 前提:
  - TokenRegistry は UUPS + Ownable。登録はオーナーのみ可能
  - チェーンごとに登録が必要（L1/L2/テストネット別）
  - シンボル名は大小文字まで一致比較（`Strings.equal`）。例: "JPYC"

---

## エンドユーザー操作（JPYCの送受金）

前提: 管理者が TokenRegistry に "JPYC" を登録済み。手数料通貨は ETH/WETH/DAI/USDC のいずれか（JPYCでは不可）。

### 送金（メールアドレス宛）
- 件名: `Send 1000 JPYC to friend@example.com`
- 動作: あなたのウォレットから JPYC が「未請求残高」に移り、受取人が後でクレームします。
- 注意: 手数料は ETH/WETH/DAI/USDC のいずれかで差し引かれます。

### 送金（ETHアドレス宛）
- 件名: `Send 500 JPYC to 0xAbC123...`
- 動作: JPYC をそのまま指定のアドレスへ転送します。

### スワップ（任意）
- 例: `Swap 1000 JPYC to USDC`
- 条件: Uniswap 拡張がインストール済みで、対象チェーンにプールがあること（ない場合は WETH 経由）。

### 受取（クレーム）
- フロー: 受取人は通知メールに従って自分のウォレットを初期化し、未請求残高から JPYC をクレームします（メールアドレスはコミットで扱われ、オンチェーンに露出しません）。
- 期限: 設定された有効期限内にクレームされない場合、送金者に返還される設計が可能です（環境設定依存）。

### 失敗しやすいポイント
- TokenRegistry 未登録（"JPYC" 未登録）
- 件名のフォーマット不一致（スペース/大文字小文字/順序の違い）
- 手数料通貨の未対応（JPYC は不可）
- 受取人種別の混在（メール宛とアドレス宛を同時指定は不可）

---

## 件名テンプレート（コピペ用）

件名は厳密一致が必要です。以下のとおり「単語」「スペース」「大文字小文字」を正確に入力してください。

### 送金（メールアドレス宛）
```
Send 1000 JPYC to friend@example.com
```

### 送金（ETHアドレス宛）
```
Send 500 JPYC to 0xAbC1234567890abcdefABC1234567890abCDef0
```

### スワップ（Uniswap 拡張）
```
Install extension Uniswap
Swap 1000 JPYC to USDC
Swap 1000 JPYC to ETH with 0.5 slippage
Uninstall extension Uniswap
```

注意:
- `Send` / `Swap` / `Install extension` / `Uninstall extension` は先頭大文字。
- トークン名は `JPYC` と正確に記載。
- 数量は 10 進数表記（例: `0.5`）。カンマ区切りや全角は不可。
- 受取人は「メール」または「ETHアドレス」のどちらか一方のみ。
- 手数料通貨は件名で指定しません（ETH/WETH/DAI/USDC の中からアプリ/設定で選択）。

### 補足（本文について）
- 基本は「件名だけ」で動作します。本文は空で構いません。
- 本文を記載してもオンチェーンには公開されません（ZKにより必要最小限のみ使用）。

---

## どこを触るのか

- コントラクト: `packages/contracts/src/utils/TokenRegistry.sol`
  - 単一/複数登録: `setTokenAddress(chainId, tokenName, addr)` / `setTokenAddresses(...)`
  - 取得: `getTokenAddress(chainId, tokenName)`
- 参考: `packages/contracts/README.md` デプロイ手順、`script/01_DeployTokenRegistry.s.sol`

---

## 事前準備

1) JPYC の正しいトークンアドレスをチェーン別に確認（公式リポジトリ/エクスプローラで検証）
2) TokenRegistry のプロキシアドレスを把握（デプロイログ or 環境変数 `TOKEN_REGISTRY`）
3) その TokenRegistry のオーナー秘密鍵を用意（`owner()` が自分であること）

---

## オーナー確認（任意）

```bash
# 例: cast で owner() を確認
export TOKEN_REGISTRY=0xYourTokenRegistryProxy
cast call $TOKEN_REGISTRY "owner()(address)" --rpc-url $RPC_URL
```

---

## 単一チェーンに JPYC を登録（cast）

```bash
# 例: Sepolia (chainId=11155111) に JPYC を登録
export TOKEN_REGISTRY=0xYourTokenRegistryProxy
export JPYC_SEPOLIA=0xYourJPYCOnSepolia

cast send $TOKEN_REGISTRY \
  "setTokenAddress(uint256,string,address)" \
  11155111 JPYC $JPYC_SEPOLIA \
  --private-key $PRIVATE_KEY \
  --rpc-url $RPC_URL
```

検証:
```bash
cast call $TOKEN_REGISTRY \
  "getTokenAddress(uint256,string)(address)" 11155111 JPYC \
  --rpc-url $RPC_URL
```

---

## 複数チェーンをまとめて登録（forge script）

プロジェクトに簡易スクリプトを追加して一括登録できます（オーナー権限で実行）。

```solidity
// packages/contracts/script/RegisterJPYC.s.sol
// forge script script/RegisterJPYC.s.sol:RegisterJPYC --broadcast --rpc-url $RPC_URL -vvvv
// 環境変数: TOKEN_REGISTRY, JPYC_MAINNET, JPYC_OPTIMISM, JPYC_ARBITRUM, JPYC_SEPOLIA

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {TokenRegistry} from "../src/utils/TokenRegistry.sol";

contract RegisterJPYC is Script {
    function run() external {
        address tokenRegistryAddr = vm.envAddress("TOKEN_REGISTRY");
        TokenRegistry reg = TokenRegistry(payable(tokenRegistryAddr));

        vm.startBroadcast();

        // 任意の必要チェーンだけ実行
        // mainnet は chainId=0 をレジストリ内部で使用
        address jpycMain = vm.envOr("JPYC_MAINNET", address(0));
        if (jpycMain != address(0)) {
            reg.setTokenAddress(0, "JPYC", jpycMain);
        }

        address jpycOp = vm.envOr("JPYC_OPTIMISM", address(0));
        if (jpycOp != address(0)) {
            reg.setTokenAddress(10, "JPYC", jpycOp);
        }

        address jpycArb = vm.envOr("JPYC_ARBITRUM", address(0));
        if (jpycArb != address(0)) {
            reg.setTokenAddress(42161, "JPYC", jpycArb);
        }

        address jpycSep = vm.envOr("JPYC_SEPOLIA", address(0));
        if (jpycSep != address(0)) {
            reg.setTokenAddress(11155111, "JPYC", jpycSep);
        }

        vm.stopBroadcast();
    }
}
```

---

## 実行例（forge script）

```bash
cd email-wallet/packages/contracts
export TOKEN_REGISTRY=0xYourTokenRegistryProxy
export JPYC_SEPOLIA=0xYourJPYCOnSepolia

forge script script/RegisterJPYC.s.sol:RegisterJPYC \
  --broadcast --rpc-url $RPC_URL -vvvv

# 検証
cast call $TOKEN_REGISTRY \
  "getTokenAddress(uint256,string)(address)" 11155111 JPYC \
  --rpc-url $RPC_URL
```

---

## 注意事項（重要）

- 手数料通貨ではない: 現行の `_getFeeConversionRate()` は ETH/WETH/DAI/USDC のみ対応。
  - JPYC で手数料を払いたい場合はコントラクト改修とオラクル対応が必要。
- 文字列一致: トークン名は完全一致（例: "JPYC"）。表記揺れに注意。
- 誤登録の回避: 既に登録済みのトークン名/アドレスは拒否される仕様。
- マルチチェーン: チェーンごとに別々の JPYC アドレスを登録する。

---

## Uniswap 拡張での利用

- TokenRegistry に登録後、Uniswap 拡張の `Swap` 件名で "JPYC" を指定可能。
- ただし対象チェーンにプールが存在しない場合は失敗、または WETH 経由スワップ。

---

## ロールバック / 誤登録時

- 現行実装は上書き不可。アドレス修正が必要な場合は TokenRegistry を UUPS で差し替え → データ移行の運用設計が必要。
- 誤登録を避けるため、本番前にテストネットで手順検証を推奨。

---

## よくある質問（FAQ）

- Q: 登録後すぐ送金できますか？
  - A: はい。`getTokenAddress()` が非ゼロを返せば対象トークンとして扱われます。
- Q: 手数料も JPYC にできますか？
  - A: いいえ（現行は ETH/WETH/DAI/USDC）。機能追加が必要です。
- Q: シンボルは小文字でも良い？
  - A: いいえ。実装は完全一致比較。`"JPYC"` で登録・利用してください。

---

## 参考

- `packages/contracts/src/utils/TokenRegistry.sol`
- `packages/contracts/src/EmailWalletCore.sol`（手数料通貨判定）
- `packages/contracts/src/extensions/UniswapExtension.sol`
