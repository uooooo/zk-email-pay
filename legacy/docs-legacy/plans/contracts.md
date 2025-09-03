# Contracts Development Plan (Foundry) — Legacy (POC)

目的（POC）
- 自前の最小 Core/Handlers/Wallet/Registries/Verifiers/Oracle による検証（現在は「レガシー計画」）。
- v2 では上流 email-wallet 採用。詳細は `plans.v2/contracts-upstream.md` を参照。

前提
- チェーン: Base Sepolia（ChainId 84532）
- 通貨: USDC テストトークン（要アドレス）
- DKIM 信頼モデル（PoC）: Trusted Fetcher + キャッシュ（Relayer 側）
- 参照: `docs/product/zk-email-pay/Implementation-Plan.md`, `docs/engineering/zk-email-pay/Developer-Handbook.md`
- 外部ドキュメント: OpenZeppelin は Context7 + MCP Server 併用（参照元/バージョンを記録）

ディレクトリ構成（予定）
```
contracts/
  foundry.toml
  .env                 # RPC/PK 等（ローカル）
  lib/
  src/
    core/
    handlers/
    wallet/
    registries/
    verifiers/
    oracle/
    utils/
  script/
    Deploy.s.sol
    Addresses.s.sol
  test/
    core/
    registries/
    e2e/
  addresses/
    base-sepolia.json
```

セットアップ手順（POC）
1) Foundry 初期化
- `forge --version` で実行確認
- `forge init contracts`（既存 repo 内では手動作成も可）
- `forge config --list` で solc バージョン確認（推奨: ^0.8.24）

2) 依存導入
- `forge install OpenZeppelin/openzeppelin-contracts@v5`（ERC20 参照/安全関数）
- 必要に応じ、`forge install` で Email Wallet 依存を導入 or ソース持込（決定後に追記）

3) 環境変数
- `contracts/.env`
  - `RPC_URL=https://base-sepolia.g.alchemy.com/v2/...`
  - `PRIVATE_KEY=0x...`（PoC はホットキー、将来 KMS/HSM）
  - `CHAIN_ID=84532`

4) 最小コントラクト（MVP）
- TokenRegistry: 送金可能トークン（USDC 等）を登録/参照
- PriceOracle: 固定 or シンプルな設定値（手数料計算の参考）
- DKIMRegistry: PoC では空 or ピン保存の最小実装（後日 DNSSEC/ECDSA へ）
- EmailWalletCore + Handlers + Wallet: Unclaimed → Claim フローに必要な最小 API を露出
- Verifiers: `EmailSenderVerifier`, `ClaimVerifier`（Prover に合わせた Interface のみ用意、実装は後日差替可）

5) デプロイスクリプト
- `script/Deploy.s.sol`
  - 配置順例: TokenRegistry → Oracle → (DKIMRegistry) → Core → Wallet → Handlers → Verifiers
  - 出力: `contracts/addresses/base-sepolia.json`（アドレス群）
  - 反映: `services/relayer/.env`, `frontend/.env.local` へ手動/自動書込（後者はコメントとして提示）
  - 参考: Base での互換性・運用差分は `docs/engineering/zk-email-pay/research/base-compatibility.md` を参照

6) テスト
- `forge test -vvv` でユニットテスト
  - TokenRegistry: 登録/参照/権限制御
  - Core+Handlers: Unclaimed 作成/消費（ダミー Verifier で可）
  - Revert ケース: 期限切れ/二重消費/未登録トークン
- テストデータ: ダミーの公開入力/署名（後に Prover 実データへ切替）

7) アドレス固定化とバージョン
- `addresses/base-sepolia.json` をコミット
- `CHANGELOG.md`（contracts 配下）で主要変更を記録
- PR で「M1: 契約アドレス確定」DoD を満たすこと

Deliverables（DoD）
- Base Sepolia でのアドレス一覧（JSON）
- ABI 出力（必要なら `artifacts/` を CI で生成・添付）
- README 更新（deploy/run/how-to-verify）

リスク/メモ
- Verifier 実装は Prover の進度に依存。先にダミー/Mock でフロー検証を進める。
- DKIMRegistry は PoC では薄く、将来の置換前提で設計（Storage レイアウトの互換性に留意）。

---

実装チェックリスト
- [ ] Foundry 基盤（foundry.toml, lib）
- [ ] OZ 導入（Context7 + MCP で参照）
- [ ] TokenRegistry/Oracle/DKIMRegistry の最小実装
- [ ] Core/Handlers/Wallet の API 形状確定
- [ ] デプロイスクリプトと addresses 出力
- [ ] ユニット/リバートテスト
- [ ] アドレスの env 反映と共有
