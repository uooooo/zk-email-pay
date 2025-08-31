# Relayer Development Plan

目的
- 送金作成→招待送信→返信受信→証明→チェーン送信→完了通知の一連を自動化。
- API 提供、メール送受（IMAP/SMTP）、Prover/Contracts 連携、DB 記録を PoC から段階的に実装。

前提
- DKIM 信頼（PoC）: Trusted Fetcher + キャッシュ（Relayer が DNS から取得/検証/キャッシュ）
- メール: Gmail IMAP/SMTP + アプリパスワード（将来は独自ドメイン＋SES 等）
- 鍵管理: `.env` にホットキー（本番は KMS/HSM）
- 参照: `docs/product/zk-email-pay/Implementation-Plan.md`, `docs/engineering/zk-email-pay/Developer-Handbook.md`

ディレクトリ構成（予定）
```
services/relayer/
  src/
    server.ts            # HTTP エントリ（/api/*）
    routes/
    mail/
      smtp.ts            # 送信
      imap.ts            # 受信/ポーリング
      templates/
        invite.html
        completed.html
        failed.html
    jobs/
      processor.ts       # 再試行/キュー（最初は軽量実装）
    chains/
      contracts.ts       # 連携（viem/wagmi）
    prover/
      client.ts          # Prover API client
    db/
      schema.sql or prisma/
    utils/
  package.json (or bunfig.toml)
  .env
  Dockerfile
```

API 設計（暫定）
- `POST /api/send`
  - req: { fromAddr, to: { email or 0x }, amount, token, expiry, memo }
  - res: { paymentId, status: 'Created', accountKey, message }
- `POST /api/createAccount`（任意, 将来拡張）
- `POST /api/isAccountCreated`
- `POST /api/getWalletAddress`（accountKey → walletAddress）
- `POST /api/nftTransfer`（任意）

メール処理
- 送信: `templates/` で招待/完了/失敗の雛形を管理（subject/本文を厳格化）
- 受信: `imap.ts` でポーリング（例: 15s〜60s）。件名に `Claim` or `accountKey` を含める。
- DKIM: DNS から公開鍵を取得して検証（PoC）。結果を DB/キャッシュへ保存。

Prover/Contracts 連携
- 返信メール→ヘッダ/本文/ポインタ抽出→Prover `/prove/email` へ
- `proof`/`publicSignals` を Core へ提出（Relayer が送信者）
- Unclaimed 消費→着金→完了通知メール送信

DB 設計（最小）
- accounts(id, email_hash, wallet_addr, created_at)
- payments(id, from_addr, to_email_hash or to_addr, token, amount, expiry, status, account_key)
- emails(id, message_id, type, direction, status, meta)
- relayer_jobs(id, type, payload, status, attempts, last_error)
- limits(id, key, window, count, max)

環境変数（例）
- `CORE_CONTRACT_ADDRESS`, `CHAIN_ID`, `CHAIN_RPC_PROVIDER`, `PRIVATE_KEY`
- `IMAP_DOMAIN_NAME`, `IMAP_PORT`, `SMTP_DOMAIN_NAME`, `LOGIN_ID`, `LOGIN_PASSWORD`
- `PROVER_ADDRESS`, `DATABASE_URL`, `FEE_PER_GAS`

実装ステップ
1) API スケルトン（/api/send のみ先行）
2) メール送信（invite テンプレ）
3) IMAP ポーリング（返信取得）
4) Prover 連携（スタブ → 本物）
5) Contracts 連携（ダミー → 本物）
6) ステータス更新/通知メール
7) リトライ/レート制限/エラーログ

テスト/運用
- ローカル: Docker の Postgres 起動、`.env` 設定、`bun run dev`（または `node`）
- 代表異常系: DKIM失敗、期限切れ、二重請求、メール受信不可
- メトリクス: 送信成功率、受信検知遅延、証明時間、Tx 成功率

Deliverables（DoD）
- `/api/send` 経由で招待メールが送られる
- 返信メール→Prover→Core で Unclaimed→Claim が成立
- ステータスが DB に記録される

将来強化
- 本番メール基盤（独自ドメイン, DKIM/DMARC/SPF）
- ジョブキュー（Redis/BullMQ）とワーカー分離
- 監視/アラート（DKIM失敗率, 証明時間, Tx 成功率）

チェックリスト
- [ ] API スケルトン
- [ ] 招待メール送信
- [ ] IMAP 受信/フィルタ
- [ ] Prover 呼び出し
- [ ] Contracts 呼び出し
- [ ] ステータス/再試行
