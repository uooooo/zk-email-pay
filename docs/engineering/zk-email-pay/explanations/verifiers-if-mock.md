# Verifier Interfaces + Mock Implementations — Explanation (#12)

目的
- Core/Handlers を ZK 実装から疎結合にするため、Verifier のインタフェースを定義し、Mock 実装とテストで振る舞いを確認する。

変更ファイル
- IF
  - `contracts/src/verifiers/IEmailSenderVerifier.sol`
  - `contracts/src/verifiers/IClaimVerifier.sol`
- Mock
  - `contracts/src/verifiers/mocks/MockEmailSenderVerifier.sol`
  - `contracts/src/verifiers/mocks/MockClaimVerifier.sol`
- テスト（分岐追加）
  - `contracts/test/UnclaimsFlow.t.sol`（ClaimVerifier=false で `PROOF_INVALID` を期待）

設計/文法
- IF 形状: `function verify(bytes calldata proof, bytes calldata publicInputs) external view returns (bool)`
  - Circom/snarkjs の出力に依存しない最小形。後日、公開入力の形（ABI 固定）を拡張予定。
- Mock は `result` を保持し、`setResult(bool)` で切替可能。
- Core は `IEmailSenderVerifier`/`IClaimVerifier` を保持。MVP では `claim` 側のみ使用。

テスト観点
- 正常系（既存）: `result=true` で `claimUnclaimed` が成功し `used=true`。
- 異常系（追加）: `result=false` で `claimUnclaimed` が `PROOF_INVALID` により revert。

受入基準（OK）
- `forge test` が PASS（正常/異常分岐を網羅）。
- Core/Handlers は IF のみ参照し、Mock を Deploy スクリプトに含めない（テスト専用）。

今後
- 公開入力の ABI 整理（domainHash/selectorHash/recipient_email_commit 等）
- EmailSenderVerifier 用の分岐テストも追加（将来、メール送信者の検証で使用）
