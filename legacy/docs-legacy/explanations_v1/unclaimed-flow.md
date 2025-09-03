# Unclaimed Flow — Nonce + Events + Signatures Explained (#13)

目的
- Unclaimed レコードに `nonce` を導入し、イベント/シグネチャを拡張。再放送防止や将来のコミット設計に備える。

変更ファイル
- Handler
  - `contracts/src/handlers/UnclaimsHandler.sol`
    - `Unclaimed` に `uint96 nonce` を追加
    - `UnclaimedCreated` イベントに `nonce` 追加
    - `createUnclaimed(...)` に `nonce` 引数を追加
- Core（プロキシ）
  - `contracts/src/core/EmailWalletCore.sol`
    - `createUnclaimed(...)` に `nonce` 引数を追加し、Handler へ委譲
- テスト
  - `contracts/test/UnclaimsFlow.t.sol` で新シグネチャに追従（nonce を渡す）

設計意図
- `nonce` は受信側コミット（`recipient_email_commit`）と組み合わせ、同一メールに対する多重請求や再放送を防ぐ足がかり。
- 型は将来の拡張を見越して `uint96`（event/ABI サイズと妥協）。

テスト観点
- 既存ケース（成功・期限後 cancel・期限切れ claim）は維持。
- `unclaimedById(id)` の戻り値タプルが 1 要素増えるため、デストラクトの位置を調整。

受入基準（OK）
- ビルド/テストが通る。
- 既存フローの挙動に変更なし（nonce 追加で壊れない）。

残課題（次チケットで対応）
- 二重消費/存在しないIDのガードを追加テスト
- イベントに `msg.sender`/受取アドレスなどメタ情報の検討
- `emailCommit` の生成規約と検証器の公開入力整備（#12 と連動）
