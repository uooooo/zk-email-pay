# Integration Strategy — zkemail/email-wallet

対象リポジトリ
- email-wallet: https://github.com/zkemail/email-wallet
- email-wallet-sdk: https://github.com/zkemail/email-wallet-sdk

要旨
- 本プロジェクトの PoC は、最小のレジストリ/オラクル/Unclaimed フローで土台を整え、Relayer/Prover/Frontend の全体接続を早期に実現する方針で進めた。
- 中長期は、email-wallet の設計/コントラクト/SDK を“再利用/互換”の形で取り込み、独自拡張（料金/制限/UX）のみ差分にするのが妥当。

観点別の検討
1) コントラクト（email-wallet-contracts）
- Core/Handlers/Wallet/Verifiers/Registries が揃っている。ZK 検証の I/F/レイアウトが確立済み。
- Pros: 実績/互換性/保守負荷の軽減。将来アップストリーム追従可能。
- Cons: ストレージ/イベント仕様に依存。独自拡張（料金/制限）をどう載せるかの設計が必要。
- 方針（提案）:
  - 現行の最小実装を「移行用アダプタ」とみなし、段階的に email-wallet のコアへ寄せる。
  - 置換候補: Core/Handlers/Verifier コントラクト。TokenRegistry/PriceOracle は外付けでも可。

1) SDK（email-wallet-sdk）
- Blueprint/Registry/EML 取得/Regex 等のユーティリティ。公開入力の整形を簡素化できる。
- Pros: Prover 前段の入力生成や Relayer の EML 処理に直結。
- Cons: バージョン互換/回路前提に密接。PoC の入力スキーマと差分が出る可能性。
- 方針（提案）:
  - Prover 側入力生成に SDK を導入（stub → 実データ化）。
  - Relayer で EML から headers/body 抽出→SDK 呼び出し→Prover へ。

1) Prover（email-wallet）
- Circom 回路・検証器・運用の参考実装がある。
- Pros: DKIM/本文制約/公開入力の要件が整理済み。
- Cons: 回路サイズ/鍵配布/計算資源の要件が別途必要。
- 方針（提案）:
  - まずは stub → snarkjs 連携 → circuits/keys の段階導入。
  - DKIM 信頼モデル（Trusted Fetcher）に合わせ、公開入力を email-wallet 準拠へ寄せる。

1) 互換性と Base 対応
- email-wallet の EVM 前提は Base に適合（BN254 等）。
- 既存の Base 互換メモ（`docs/engineering/zk-email-pay/research/base-compatibility.md`）に沿ってアドレス/手数料/最終性を運用側で吸収。

段階的移行プラン（提案）
- Phase 1（現状）: 最小フローを自前実装で通す（DONE）。
- Phase 2（Prover/Relayer 強化）: SDK を導入し、公開入力を email-wallet 準拠に合わせる。snarkjs 連携。
- Phase 3（Contracts 置換/併用）: Core/Handlers/Verifier を email-wallet-contracts に置換 or 併用（Adapter パターン）。
- Phase 4（完全互換/拡張）: 手数料/制限/拡張は Extension として外出し、アップストリームに追従。

リスク/留意
- 依存更新に伴うブレイク。CI/E2E で検知。
- 仕様差（イベント/公開入力/エラーコード）。Adapter/Facade を用意。
- ライセンス/貢献方針の確認。

アクション候補
- SDK 導入 PoC（Prover 側）Issue 起票
- contracts を email-wallet-contracts に差し替える検討 Issue 起票
- Relayer の EML/Regex/Blueprint 化 Issue 起票
