# Core / Handlers / Wallet — Skeleton Explained

目的
- Unclaimed→Claim の最小フローをローカルで検証するための Core/Handler/Wallet と Verifier IF/Mock の意図・設計・テスト観点をまとめる。

対象
- Core: `contracts/src/core/EmailWalletCore.sol`
- Handler: `contracts/src/handlers/UnclaimsHandler.sol`
- Wallet: `contracts/src/wallet/Wallet.sol`
- Verifier IF/Mock: `contracts/src/verifiers/*`
- Flow test: `contracts/test/UnclaimsFlow.t.sol`

---

## 1. 設計方針（MVP）
- オーナー（owner）が Relayer 相当。owner 経由でハンドラを実行（将来は Role/ACL に拡張）。
- ハンドラは `Ownable` で `onlyOwner`。本番では Core がオーナーになり、Core からのみ実行可能。
- Verifier は IF のみ依存。実際の ZK 検証は後日差替可能（今は Mock）。
- TokenRegistry と PriceOracle は参照のみ（今回のスケルトンでは送金/控除は未実装）。

---

## 2. 各コントラクトの役割
- EmailWalletCore
  - TokenRegistry/PriceOracle/Verifiers/UnclaimsHandler を保持し、owner からの呼出しをハンドラへプロキシ。
  - メソッド: `createUnclaimed`, `cancelUnclaimed`, `claimUnclaimed`（いずれも `onlyOwner`）。
- UnclaimsHandler
  - 構造体 `Unclaimed { token, amount, expiry, emailCommit, used }`
  - `createUnclaimed`: TokenRegistry の allowlist チェック、ID 採番、イベント発火。
  - `cancelUnclaimed`: 期限切れ後のみ cancel、`used` マーク。
  - `claimUnclaimed`: 期限内かつ Verifier 検証 OK で `used` マーク。
- Wallet
  - `execute(address to, uint256 value, bytes data)` を `onlyOwner` で実行できる最小ウォレット。
- Verifier IF/Mock
  - IF: `IEmailSenderVerifier`, `IClaimVerifier` は `verify(bytes proof, bytes publicInputs)` を定義。
  - Mock: コンストラクタ/セッターで `true/false` を切替可能。テストに利用。

---

## 3. Solidity 文法/実装の要点
- `Ownable(initialOwner)` コンストラクタでオーナーを注入。
- イベント: `UnclaimedCreated/Cancelled/Claimed` を最小定義。
- `external` より `public view` の方が内部/他コントラクトからの参照に柔軟のため、TokenRegistry `isAllowed` は `public view` に変更（微最適化）。
- 時刻/期限: `uint64 expiry`、`block.timestamp` を用いたシンプルなガード。

---

## 4. テスト観点と合格基準
- ファイル: `contracts/test/UnclaimsFlow.t.sol`
- セットアップ:
  - 各コンポーネントをデプロイ、Registry にダミートークンを allow。
  - ハンドラのオーナーを Core へ移譲（`handler.transferOwnership(core)`）。
- ケース:
  - 作成→クレーム成功（Mock Verifier = true）
  - 期限後キャンセル成功（`block.timestamp` を `vm.warp` で前進）
  - 期限切れクレームは revert（`EXPIRED`）
- 合格:
  - `forge test` が PASS（各ケースで `used` の更新/イベント/revert を検証）。

---

## 5. 次ステップ（関連 Issue）
- #12 Verifier IF の公開入力整備と Mock 分岐テストの拡充
- #13 Unclaimed の `nonce/email_commit/ID` 詳細設計とイベント整備
- #14 SafeERC20 + TokenRegistry + 手数料控除の統合（PriceOracle 連携）
- #15 Deploy スクリプトを拡張し、アドレス JSON をネットワーク別に出力

参考
- 設計: `docs/product/zk-email-pay/contracts.md`
- 計画: `docs/engineering/zk-email-pay/plans/contracts.md`
