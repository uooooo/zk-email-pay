# Base Compatibility: zk-email + Email Wallet

目的
- Ethereum L1 向けの zk-email / Email Wallet 設計を Base（OP Stack L2）で動かす際の差分・留意点を整理し、実装判断を早くする。

結論（サマリ）
- 基本はそのまま動作可能。Email Wallet の on-chain 検証は EVM 等価で、BN254（alt_bn128）ペアリング前提の ZK 検証は Base でも利用可能。
- 調整点は「チェーンID・アドレス・ガス/最終性・手数料推定・USDC アドレス」などの運用面が中心。回路/証明フォーマットの変更は不要。

適用範囲
- チェーン: Base Mainnet（8453）/ Base Sepolia（84532）
- コンポーネント: Contracts（Verifier/Core/Wallet/Registries）、Relayer、Prover、Frontend（RPC設定）

---

## 1. EVM 等価性と前提
- Base は OP Stack 上の EVM 等価 L2。一般的な EVM プリコンパイル（BN254 pairing/ECADD/ECMUL 等）を提供。
- Email Wallet の on-chain 検証（例: Groth16/BN254）に必要なプリコンパイルは利用可能。移植コストは低い。
- Circom/snarkjs 生成の証明/公開入力はチェーン非依存。Verifier コントラクトが EVM 上でペアリング検証できれば動作。

参考ポイント
- Contract size/gas の上限は L1 と異なるが、OP Stack でも一般的な Solidity 契約は問題なく配置可。

---

## 2. チェーンID・署名・ドメイン分離
- Chain ID が L1 と異なる（Base Mainnet=8453, Base Sepolia=84532）。
- 署名（EIP-155/EIP-712）やメッセージドメインを使用する場合、Chain ID 依存の値は Base 用に更新。
- Email Wallet の ZK 検証自体は署名仕様とは独立だが、周辺の meta/nonce 設計で Chain ID を public input に含める場合は再確認。

---

## 3. ガス・手数料・最終性
- ガス: L2 のトランザクション料金は安価だが、バッチ投稿に起因する L1 データコストが内包。見積もりは L2 固有の価格モデルに依存。
- 最終性: L1 と異なるブロックタグ/確定概念がある（safe/finalized 等）。
  - Relayer は「何 confirmations 待つか」を L2 仕様に合わせて調整（例: Base では数ブロック〜safe/ finalized 待ち）。
- 手数料推定: OP Stack の Gas Price Oracle（0x420... プレデプロイ）を使うと L1/L2 成分の推定が可能。
  - MVP では `FEE_PER_GAS` を固定も可。将来、Oracle 参照へ拡張。

---

## 4. USDC/トークンと TokenRegistry
- USDC は Base にネイティブで存在（L1 とアドレスが異なる）。
- TokenRegistry には Base の各トークンアドレス（USDC/テストトークン）を登録する。
- 小数桁（decimals）はネットワーク固有のトークンに依存（USDC=6 を前提に UI/コントラクトの単位処理を統一）。

---

## 5. RPC/ライブラリ設定（frontend/relayer）
- Frontend/Relayer の RPC クライアント設定を Base 用に変更。
  - Chain ID: 8453（mainnet）、84532（sepolia）
  - RPC 例: `https://base-mainnet.g.alchemy.com/v2/...`、`https://base-sepolia.g.alchemy.com/v2/...`
- ライブラリ（viem/wagmi）のチェーン定義を Base に設定。Block tag の扱い（safe/finalized）に注意。

---

## 6. DKIM 信頼モデル（PoC）とレジストリ
- PoC は Trusted Fetcher + キャッシュ（Relayer 側）で L1/L2 非依存。
- 将来、DNSSEC または オンチェーン ECDSA Owned DKIM Registry を導入する場合、Base 上に Registry を配置可能。
- Registry を L1 と L2 のどちらに置くかは運用/可用性/コストで選択（MVP は L2 単独運用）。

---

## 7. ブリッジ/クロスドメイン（将来）
- L1↔L2 の資産やステートを跨ぐ場合はブリッジ/メッセージング（Optimism Portal 等）が必要。
- MVP は「同一チェーン（Base）で完結」する。Unclaimed/Claim は Base 内で生成/消費。
- 将来、L1 USDC との連携や他 L2 での受取を目指すなら、
  - 送金チェーン固定 or クロスチェーンの Unclaimed 表現
  - 受取側チェーンでの検証/解放設計
  - メッセージ検証の信頼境界（L1 証明の取り扱い）
  を別途設計。

---

## 8. デプロイ/検証フローの差分
- ネットワーク: `base-sepolia` / `base` を Foundry で指定。`.env` の `RPC_URL`/`CHAIN_ID` を更新。
- Verifier/Core/Handlers/Wallet/Registries を Base にデプロイし、アドレス JSON を `contracts/addresses/base(-sepolia).json` に保存。
- Frontend/Relayer の `.env` にアドレスを反映。
- Etherscan 相当: Basescan でソース検証。

---

## 9. リスクと対策
- ガス見積もりずれ: L2 固有の pricing で under/over-pay → Oracle 参照または保守的バッファ。
- 最終性待ち: 早すぎる確定扱いで UX/整合性不全 → safe/finalized 待ちの実装と再送設計。
- USDC アドレス誤設定: ネットワーク混同 → `TokenRegistry` と `.env` のレビュー/テストで検知。
- プリコンパイル前提の差異: 互換性テストでペアリング検証を事前確認（`forge test` + gas snapshot）。

---

## 10. アクションチェックリスト（MVP）
- [ ] Foundry の Network 設定を Base（Sepolia→Mainnet）に対応
- [ ] Verifier/Core/Handlers/Wallet/Registries を Base にデプロイ
- [ ] `addresses/base-sepolia.json` を作成し、環境へ反映
- [ ] TokenRegistry に Base の USDC/テストトークンを登録
- [ ] Relayer の最終性待ち戦略（confirmations or safe/finalized）を設定
- [ ] 手数料推定は固定値→将来 Oracle 参照へ拡張
- [ ] Frontend/Relayer の RPC・Chain ID を Base に設定

---

## 参考リンク（推奨）
- Base docs（OP Stack/fees/finality/Basescan）
- OP Stack Gas Price Oracle（0x420...）
- Basescan（contract verification）
- USDC on Base（公式発表/アドレス）
- EVM precompiles（BN254 pairing availability）
