# SafeERC20 Transfers + Escrow/Refund/Payout — Explanation (#14)

目的
- Unclaimed フローに ERC20 の実移転を導入（作成でエスクロー、期限後返金、クレーム時支払い）。手数料はプレースホルダで Core/owner に送付。

変更ファイル
- Handler: `contracts/src/handlers/UnclaimsHandler.sol`
  - SafeERC20 を導入。`Unclaimed` に `funder` を追加。
  - `createUnclaimed(token, amount, expiry, emailCommit, nonce, funder)`
    - `safeTransferFrom(funder, address(this), amount)` でエスクロー。
  - `cancelUnclaimed(id)`
    - `safeTransfer(funder, amount)` で返金。
  - `claimUnclaimed(id, recipient, feeAmount, proof, publicInputs)`
    - `payout=amount-fee` を recipient に、`fee` を `owner()` に送付。
- Core: `contracts/src/core/EmailWalletCore.sol`
  - 上記に合わせ proxy 引数を拡張（funder/recipient/feeAmount）。
- Tests
  - `contracts/test/mocks/MockERC20.sol` 追加（mint/decimals 指定可能）
  - `contracts/test/UnclaimsFlow.t.sol` を更新（mint/approve/escrow/claim/cancel を通す）

設計/前提
- TokenRegistry の allowlist を満たすトークンのみ対象。
- ReentrancyGuard を導入し、Effects→Interactions の順序に修正（`used=true` を外部転送前に設定）。
- `feeAmount` は MVP のプレースホルダ（価格単位整合は今後 PriceOracle 連携で整理）。
- `owner()` はリレーアー想定。将来は fee 受取先を明示引数にする選択肢も。

テスト観点（今後拡充）
- エスクロー/返金/支払いのバランス変化（現在はパスのみ、残高主張は次 PR で追加）。
- `feeAmount=0`/非 0 の分岐。
- 許可外トークンの場合の revert。

注意
- 署名/API 変更につき、Relayer/Frontend との結合時に ABI を同期すること。
