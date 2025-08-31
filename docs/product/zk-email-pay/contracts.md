# コントラクト設計

Email Wallet（`docs/zkemail/zkemail-emailwallet/*`）の構成に準拠しつつ、本プロダクトに必要な役割を明記します。

## コア/ハンドラ
- `EmailWalletCore.sol`
  - `handleEmailOp` 相当のエントリで各操作を実行。
  - ガス計算/料金控除の方針は `PriceOracle` + `FEE_PER_GAS` に準拠。
- `handlers/RelayerHandler.sol`
  - リレーヤー設定の登録/更新（リレー先、料金設定、サポートドメイン等）。
- `handlers/AccountHandler.sol`
  - `createAccount` / `initAccount` / `transportAccount` 等。初回受取で自動実行。
- `handlers/UnclaimsHandler.sol`
  - Unclaimed Funds/States の登録/取消/消費。メール宛送金の基盤。
- `handlers/ExtensionHandler.sol`
  - 将来拡張（NFT/スワップ/請求）向け。

## ウォレット
- `Wallet.sol`（各ユーザー専用のWalletコントラクト）
  - デフォルト所有者は Core。メール操作で任意calldata実行可能。

## レジストリ等
- `utils/TokenRegistry.sol`: トークン名↔アドレスの登録。
- `utils/UniswapTWAPOracle.sol`: 料金計算で参照（MVPは固定/簡易でも可）。
- `utils/ECDSAOwnedDKIMRegistry.sol`（採用を検討）: ドメインのDKIM鍵を安全に管理。

## 検証器（Verifiers）
- `verifier/EmailSenderVerifier.sol`: 返信メールの正当性検証（DKIM/ZK）。
- `verifier/ClaimVerifier.sol`: Unclaimedのクレーム検証。
- `verifier/AccountCreationVerifier.sol` / `AccountInitVerifier.sol`: 初回オンボーディング。
- 必要に応じ `AccountTransportVerifier.sol`, `AnnouncementVerifier.sol`。

## Unclaimed → Claim の流れ（概略）
1) 送金作成時に UnclaimsHandler で `recipient_email_commit` をキーとして資金/状態をロック（`nonce`/`expiry`含む）。
2) 受取者がメール返信→`EmailSenderVerifier` で DKIM/ZK検証。
3) `ClaimVerifier` が `recipient_email_addr` と `relayer_rand_hash` から `recipient_email_commit` を再現し一致を検証。
4) 一致かつ未使用なら Unclaimed を消費し、受取者Walletに送金。

## 公開入力/イベント（例）
- 公開入力: `domainHash`, `selectorHash`, `commandCommitment`, `expiry`, `nonce`, `recipient_email_commit` 等。
- イベント: `UnclaimedCreated`, `UnclaimedClaimed`, `UnclaimedCancelled`, `AccountCreated`, `AccountInitialized`。

## ガス/料金
- Relayer が送信、`PriceOracle` でトークン建て手数料を算出→送金時に控除または別途請求。

## 互換性ポリシー
- 既存 Email Wallet デプロイのアドレス群（ネットワーク別）を参照し、再利用/拡張。
- 独自拡張は Extensions SDK を優先（本体改変を極小化）。

