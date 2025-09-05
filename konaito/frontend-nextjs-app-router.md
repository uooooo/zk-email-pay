## Frontend 要件定義（Next.js App Router 版）

対象: zk-email-pay の Web フロントエンド。Next.js App Router + TypeScript（strict）/ Tailwind + shadcn / Bun / Vercel を前提。

---

### 1. スコープ/目的
- メールアドレス宛の送金（ETH/ERC20）、未請求（Unclaims）のクレーム、引き出し（withdraw）を、メール主体の UX で安全かつ分かりやすく提供。
- 2モード運用: 開発=公開 Relayer API/公開コントラクト参照、本番=自社 Relayer/Prover/DB 参照。
- UI は拡張（NFT/Swap 等）に対応できるコンポーネント設計。

---

### 2. ディレクトリ/構成（App Router）
- `frontend/src/app/` ルーティング
  - `layout.tsx`（ルートレイアウト、テーマ、トースト、ヘッダ/フッタ）
  - `page.tsx`（ダッシュボード）
  - `send/page.tsx`（送金）
  - `claim/page.tsx`（未請求一覧/クレーム）
  - `withdraw/page.tsx`（引き出し）
  - `account/page.tsx`（アカウント状態/作成ガイド）
  - `status/[id]/page.tsx`（非同期処理ステータス）
  - `api/` は使用しない（Relayer API を直接叩く）。
- `frontend/src/components/` UI コンポーネント（shadcn ベース）
- `frontend/src/lib/`
  - `api/relayer.ts`（Relayer API クライアント）
  - `chain/ethers.ts`（オンチェーン読み取り）
  - `subgraph.ts`（サブグラフ読み取り）
  - `format.ts`（金額/アドレス/日付）
  - `validators.ts`（email/EOA/amount）
- `frontend/src/styles/` Tailwind 設定

App Router 方針
- サーバコンポーネント優先。フォーム/インタラクション部分のみ Client Component。
- データ取得は Server Component（キャッシュ/再検証）+ SWR（クライアント再検証）。

---

### 3. ルート要件
`/` ダッシュボード
- 自分のメールウォレットの概況（残高、未請求数、最近の処理）。
- エラー時も部分的に表示（スケルトン/フォールバック）。

`/send`
- フォーム: 「宛先（email/EOA 切替）/ トークン / 金額」。
- 見積パネル: 手数料/受取概算/チェーン表示。確認モーダルで最終確認。
- 送信後は `status/[id]` に遷移、ポーリングで完了/失敗表示。

`/claim`
- 未請求一覧（ID/トークン/額/期限/発生 Tx）。
- 行単位で「クレーム」実行→確認→`status/[id]`。
- 期限切れは不可、void 説明とサポート導線。

`/withdraw`
- 自分のメールウォレット→外部 EOA（0x…）へ送金（メール経由の実行）。
- バリデーション（チェックサム、最小/最大、残高確認）。

`/account`
- アカウント作成/初期化の進捗、ウォレットアドレス表示、Relayer メールアドレス表示。
- 招待のみ/少額同封の起点（運営向けは非表示/別ビルドフラグ）。

`/status/[id]`
- リクエスト ID の状態を 2→4→8→…（最大 60s）で指数ポーリング。
- 成功/失敗の詳細、Explorer リンク、再試行ボタン。

---

### 4. コンポーネント要件
- Form: `AddressOrEmailField`, `AmountField`, `SelectToken`, `ChainSelect`。
- Status: `TxBadge`, `ProgressSteps`, `AlertBanner`, `Toast`。
- Data: `BalanceCard`, `UnclaimedList`, `HistoryTable`。
- Modal: `ConfirmSend`, `ConfirmClaim`, `FeeDetail`。
- Skeleton: ページ/カード/リスト/ボタン。

UI/UX
- 入力即時バリデーションとガイド文。エラーはバナー＋トーストで一貫表示。
- 主要操作は 3クリック以内、フォーカス/キーボード対応。

---

### 5. API/データ連携
Relayer API（開発=公開、本番=自社）
- `GET /api/relayerEmailAddr` Relayer の受信メールアドレス取得。
- `POST /api/createAccount` 招待送信。
- `POST /api/isAccountCreated` アカウント作成済み確認。
- `POST /api/send` 送金メール送信（件名を生成して本人に送る）。
- `POST /api/unclaim` 未請求のクレーム要求。

オンチェーン/サブグラフ
- 残高/履歴/イベント取得。失敗時は UI 継続（フォールバック）。

ポーリング/冪等
- リクエスト ID で状態照会。指数バックオフ/最大 3 回リトライ。

---

### 6. 環境変数/設定
Public（クライアント参照可）
- `NEXT_PUBLIC_RELAYER_API_URL`
- `NEXT_PUBLIC_CORE_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_CHAIN_ID`
- `NEXT_PUBLIC_SUBGRAPH_URL`
- `NEXT_PUBLIC_TOKENS_JSON`

Private（Vercel で管理）
- 監視/Sentry DSN、運営向け API Key（最小限）。

モード切替
- `NEXT_PUBLIC_MODE=dev|prod` でエンドポイント/ガード切替。

---

### 7. バリデーション/エラーハンドリング
- Email: 正規表現 + ドメインヒント、中央マスク表示。
- EOA: EIP‑55 チェックサム、`0x` 形式。
- Amount: トークン小数桁に合わせた検証、Max/25/50/100% ボタン。
- エラー分類: 入力、見積失敗、実行失敗、期限切れ、Relayer 混雑。
- 表示: `AlertBanner` + `Toast`、再試行/サポート導線。

---

### 8. セキュリティ/プライバシ
- PII: メールは UI 上で部分マスク。ログ/テレメトリにメール文字列を送らない。
- Config: クライアントは `NEXT_PUBLIC_*` のみ参照。秘密は扱わない。
- CSRF/XSS: フォーム入力は型/サニタイズ。外部リンクは `rel="noopener"`。

---

### 9. パフォーマンス/アクセシビリティ
- 予算: LCP < 2.5s / TTI < 2.5s / 初回 JS < 250KB。
- 技術: ルート分割、SWR キャッシュ、`next/image`、仮想化リスト。
- a11y: キーボード操作、ARIA、コントラスト、フォーカスマネジメント。

---

### 10. フィーチャーフラグ
- `usePublicRelayer`, `useSelfHosted`, `enableOnboardingToken`, `enableNftExtension`。
- 環境変数で段階ロールアウト（dev→stg→prod）。

---

### 11. テスト/QA
- Unit: フォーマッタ/バリデータ。
- Component: 主要 UI（RTL）。
- Integration: 送金/クレーム/引出のモック連携、エラーパス。
- E2E（任意）: Playwright で主要ユーザーフロー。

---

### 12. 受入基準（抜粋）
- Send: email/EOA 宛の送金が見積→確認→送信→ステータスまで成功。チェーン/金額/桁検証あり。
- Claim: 未請求一覧表示→期限内クレーム→受取反映。期限切れは防御表示。
- Withdraw: 外部 EOA 宛の送金完了と履歴反映、Explorer リンク有効。
- Resilience: Relayer API 失敗時の再試行と明確な案内。部分機能は生存。

---

### 13. 実装の起点（雛形案）
ルーティング（例）
```
src/app/
  layout.tsx
  page.tsx
  send/page.tsx
  claim/page.tsx
  withdraw/page.tsx
  account/page.tsx
  status/[id]/page.tsx
```

ライブラリ（例）
```
src/lib/
  api/relayer.ts    // fetch ベースのクライアント
  subgraph.ts       // サブグラフ読み取り
  chain/ethers.ts   // RPC 読み取り
  validators.ts     // 入力検証
  format.ts         // 表示整形
```

コンポーネント（例）
```
src/components/
  forms/AddressOrEmailField.tsx
  forms/AmountField.tsx
  forms/SelectToken.tsx
  status/ProgressSteps.tsx
  status/TxBadge.tsx
  feedback/AlertBanner.tsx
```

---

更新: 2025-09-04
