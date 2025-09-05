# Email Wallet Usage Plan — Adopt Upstream, Focus on UX

結論（方針）
- 可能な限り zkemail/email-wallet の OSS を“利用前提”に切り替える。自前実装は当座の PoC/Adapter に限定し、体験（UX）とプロダクト独自価値に集中する。
- 技術選定は「ライブラリ/SDK/APIとして取り込む」を基本に、足りない箇所のみ Adapter/Wrapper で埋める。

上流の可用性（確認）
- email-wallet（monorepo）: contracts/relayer/docs が揃い、Quick Start で一式デプロイ可能。
- email-wallet-sdk: Extensions/Blueprint 周りの TS 契約/ユーティリティ。
- email-wallet-contracts: Core/Handlers/Wallet/Verifier 群。Foundry ベースの取り込みが容易。

採用オプション（比較）
- A) 直接採用（clone/submodule + remap）
  - Pros: 互換・更新追随が容易、総工数削減。
  - Cons: 設定/依存が重くなる可能性、拡張点は Upstream 依存。
- B) SDK/API 連携中心（必要箇所のみ）
  - Pros: 軽量に始められ、差分最小。
  - Cons: 仕様差分は Adapter 必須、網羅外は別途実装。

推奨ロードマップ（段階導入）
1) Prover 入力整形: email-wallet-sdk の Blueprint/入力整形を導入（/prove/email の publicInputs を準拠へ）
2) Contracts 置換: email-wallet-contracts を Foundry remap で導入、Unclaimed/Claim フローを Upstream の Core/Handlers/Verifier に寄せる
3) Relayer 連携: Upstream Relayer を参考にしつつ、自前 Relayer は API 互換（/api/send 等）を維持。将来は完全移行も検討
4) Docs/CI: 互換レイヤの設計を書面化、CI で upstream 追随時の破壊検知

実装ステップ（具体）
- Prover
  - 依存追加: email-wallet-sdk（Registry/Blueprint/Regex/EML ユーティリティ）
  - /prove/email: 現在の stub から snarkjs 連携へ。SDK で publicInputs 構築
- Contracts
  - `forge remappings` で email-wallet-contracts を `lib/` 配下に導入（`forge install zkemail/email-wallet-contracts`）
  - 自前の UnclaimsHandler/Core は Adapter（呼び出し互換/イベント forward）に段階的縮小
  - デプロイは upstream のスクリプトに合わせ、addresses/<network>.json を揃える
- Relayer
  - 送受信/Prover 呼び出しの I/F を upstream 準拠に合わせ、段階的に差替可能な構造
  - 当面は DKIM Trusted Fetcher + キャッシュの PoC 方針を維持

リスク/注意
- 仕様差（イベント/公開入力/DKIM モデル）→ Adapter と互換テストを用意
- 依存の更新頻度 → addresses/ABI/CI を固定化し、上流差分を定期的に取り込む運用
- ライセンス/寄与 → OSS ライセンス遵守、変更点は明瞭化

アクション（Issue 候補）
- Prover: email-wallet-sdk を導入して publicInputs 準拠化
- Contracts: email-wallet-contracts の Foundry 取り込み + 移行アダプタ設計
- Relayer: SDK/Blueprint 連携で EML→入力整形を標準化、API 互換の確認
