# zk-email-pay 開発者ハンドブック（1ファイル完全版）

このドキュメントは、本プロダクト（メールアドレス宛にステーブルコイン等を送金）の開発に必要な知識を、フロントエンド（Next.js）、Relayer、Prover、Smart Contract（Foundry）まで一気通貫で学べるよう1ファイルに凝縮した「教科書」です。実装の全体像、局所の落とし穴、ローカル起動、統合方法までを具体的に説明します。

参考（ローカル）:
- ペルソナ: `docs/user/persona.md`
- ZK Email 概説: `docs/zkemail/zk-email-overview.md`
- Email Wallet：`docs/zkemail/zkemail-emailwallet/*`
- ZK Email SDK（Registry/Blueprint）: `docs/zkemail/zkemail-sdk/*`
- 本プロダクト設計: `docs/product/zk-email-pay/*`

---

## 1. 何を作るのか（要旨）
- 宛先は「メールアドレス」。受取者がウォレット未保有でも受け取れる。
- 受取はメール中心（返信メール or 最小Webのワンクリック）。
- ガスレス（Relayer が肩代わり）。
- 秘匿性（メールアドレスはオンチェーン非公開）。
- 中核パターン: Unclaimed（未受領）→ Claim（受取）で安全にロック/解放。

---

## 2. 全体アーキテクチャ（Bird’s-eye）
- Frontend（Next.js）: 送金作成/取消/履歴（Persona1）。Relayer API を呼ぶ。
- Relayer: メール送受/キュー/証明要求/チェーン送信/通知。DB に記録。
- Prover: DKIM検証を含む ZK 証明生成（circom + snarkjs 等）。
- Contracts: Email Wallet Core/Handlers/Wallet/Verifiers/Registries/Oracle。
- DKIM 公開鍵: DNS から取得（信頼済みフェッチャ→将来的にDNSSEC/独自Registry）。

データ流れ（代表例: メール宛送金）:
1) Frontend→Relayer `/api/send`（宛先=メール）
2) Relayer→Core: Unclaimed 作成（資金/状態ロック）。招待メール送信。
3) 受取者が返信 → Relayer が IMAP で取得 → Prover で `email_sender.circom`+`claim.circom` 証明。
4) Relayer→Core: 検証OKで Unclaimed 消費→受取者 Wallet へ着金。
5) 双方に完了メール。

---

## 3. コンポーネント別の役割とつながり

### 3.1 Frontend（Next.js）
- 目的: Persona1（既存ウォレット）向けの「送金作成/取消/履歴」UI。
- 主要API（Relayer準拠）:
  - `POST /api/createAccount`（任意）
  - `POST /api/isAccountCreated`
  - `POST /api/send`（メール宛/0x宛の両方対応）
  - `POST /api/getWalletAddress`（招待メールの accountKey からアドレス解決）
- 実装指針:
  - 入力: 宛先メール/金額/トークン/期限/メモ。
  - 取消: 受取前のみ（期限内）→管理 UI から cancel 呼び出しを用意（内部APIでも可）。
  - ステータス: Created→Notified→Claimed/Expired/Cancelled。
- 最小コード例：
```
const sendAsset = async (amount, tokenId, recipient) => {
  const email = loggedInUserEmail; // ログイン済みメール
  const res = await fetch(`${RELAYER_API_URL}/api/send`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email_addr: email,
      amount: Number(amount),
      token_id: tokenId,
      recipient_addr: recipient,
      is_recipient_email: recipient.includes('@'),
      expiry: 60 * 60 * 24 * 2, // 2日
      memo: 'gift'
    })
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || 'send failed');
  return text;
};
```

### 3.2 Relayer
- 役割: 
  - API サーバ（Frontend の相手）
  - メール送受（IMAP/SMTP）、招待/完了通知
  - Prover と連携して ZK 証明生成
  - チェーン送信（ガス肩代わり）
  - DB 記録（accounts/payments/emails/jobs/limits）
- 代表的 .env（例）: `CORE_CONTRACT_ADDRESS`, `PRIVATE_KEY`, `CHAIN_RPC_PROVIDER`, `IMAP_DOMAIN_NAME`, `SMTP_DOMAIN_NAME`, `LOGIN_ID`, `LOGIN_PASSWORD`, `PROVER_ADDRESS`, `DATABASE_URL`, `FEE_PER_GAS`。
- 処理の柱:
  - Create/Send 呼び出し時に Unclaimed を作成し、招待メールを送る。
  - 受信メール（返信）をトリガに Prover で証明→Core 呼び出し→Unclaimed 消費。
  - 失敗時はキューで再試行、DLQ に退避。

### 3.3 Prover
- 役割: 回路入力の作成と証明生成（circom+snarkjs, または提供されるProverサービス）。
- 入力: 受信メールのヘッダ断片/署名 `b`/本文ハッシュ `bh`/送信ドメイン `d`/選択子 `s`/件名・タイムスタンプ・ポインタなど。
- 回路: Email Wallet の `email_sender.circom`, `claim.circom`, `account_creation.circom`, `account_init.circom` 等。
- 実行: ローカル（Python/Node）/Modal（サーバレス）でスケール。

### 3.4 Smart Contracts（Foundry）
- コア: `EmailWalletCore.sol`（`handleEmailOp`）、Handlers（Relayer/Account/Unclaims/Extension）。
- ウォレット: `Wallet.sol`（ユーザ毎）。
- Verifiers: `EmailSenderVerifier.sol`, `ClaimVerifier.sol`, `AccountCreationVerifier.sol`, `AccountInitVerifier.sol` など。
- Utils/Registry: `TokenRegistry.sol`, `ECDSAOwnedDKIMRegistry.sol`, `UniswapTWAPOracle.sol` 等。
- 使い方: 既存デプロイを再利用 or スクリプトでデプロイ（Foundry）。

---

## 4. ZK Email の使い分け（3パターン）
- A) Email Wallet を丸ごと使う（本プロダクトの既定）。
  - 長所: 回路/コントラクト/Relayer/Prover が揃っている。P2P送金・Unclaimed/Claim・拡張（NFT/Uniswap）対応。
  - 短所: コマンド表現は既存パターンに沿う。回路改変は負荷。
- B) ZK Email SDK（Blueprint/Registry）で独自証明を組み合わせる。
  - 長所: Decomposed Regex で任意のメールから値抽出→回路/Verifierを自動用意。
  - 短所: Registry 仕様の制約（未対応の正規表現、ProtonMail制限）。
- C) 自作回路/検証器でフルカスタム。
  - 長所: 認証/抽出/開示範囲を完全制御。
  - 短所: 実装・監査コストが高い。

---

## 5. ローカル開発クイックスタート

### 5.1 事前準備
- Node.js/npm、Python3、Rust/Cargo、Docker、Foundry（`forge`）。
- リポジトリ: 本プロジェクトと Email Wallet（mono-repo）があると便利。

### 5.2 コントラクト
- Foundry でビルド/デプロイ（Base Sepolia など）。
- 必要なアドレスを .env に反映：`CORE_CONTRACT_ADDRESS`, `TOKEN_REGISTRY`, `DKIM_REGISTRY`, `PRICE_ORACLE`。

### 5.3 Prover の起動
- `npm i -g snarkjs`、`pip install -r requirements.txt`。
- Email Wallet の `packages/prover/local.py` を起動（または Modal 実行）。

### 5.4 DB の起動
- `docker run -p 5432:5432 -e POSTGRES_PASSWORD=... -e POSTGRES_USER=emailwallet -e POSTGRES_DB=emailwallet postgres`
- `.env` の `DATABASE_URL` を設定。

### 5.5 Relayer の起動
- `packages/relayer/.env` をテンプレから作成、IMAP/SMTP/RPC/Prover を記入。
- Docker でビルド→ `docker run -p 80:80 -v $(pwd)/.env:/email-wallet/packages/relayer/.env email_wallet_v1_relayer:latest`

### 5.6 Frontend（Next.js）
- `.env.local` に `RELAYER_API_URL` を設定。
- 送金フォーム→`/api/send` 呼び出し→結果表示。履歴はサブグラフ or Relayer API or DBビューで確認。

---

## 6. 受取UX（メール中心）詳細
- 招待メール（送信者→受取者）: `You received X USDC ...`、有効期限/取消条件を明記、`accountKey` を埋め込む。
- 返信メール（受取者→Relayer）: 件名に `Claim` または `accountKey` を含める。本文は不要。
- Relayer は IMAP で受信→Prover→Core へ提出→完了通知。
- 初回は `account_creation`/`account_init` を内部的に実行して Wallet を自動化。

---

## 7. ZK Email SDK（Blueprint/Registry）の実用メモ
- 目的: 任意のメールから「最小開示」の証明を作りたいときに便利。
- Blueprint の主要項目:
  - 送信ドメイン（`d=`）、ヘッダ/本文最大長（64の倍数）、本文ハッシュ検証の有無。
  - Decomposed Regex（可視/非可視を交互に定義、先頭アンカー `(\r\n|^)` 推奨）。
  - 外部入力（例: 事前に与えるコード）。
- .EML の取得: Gmail/AppleMail/Outlook 等でエクスポートし、テストに使用。
- 制約: 貪欲/遅延の曖昧性、lookaround 不可、ProtonMail は本文証明不可。

---

## 8. ガス/料金/手数料の考え方
- Relayer がトランザクション送信者。`FEE_PER_GAS` と `PriceOracle` で原価試算。
- 徴収方法（MVP）: 送金時に固定/従量手数料を差引く（UIで明示）。
- 事業者プラン: プリペイド/サブスクも将来選択肢。

---

## 9. セキュリティ/プライバシー/運用
- DKIM鍵: 信頼済みフェッチャ＋ピン/キャッシュ。将来 DNSSEC or 独自 Registry（`ECDSAOwnedDKIMRegistry`）。
- 再放送防止: `nonce`/`expiry`/`email_nullifier`。Unclaimed は一回使い切り。
- フィッシング対策: ドメイン強調、短命マジックリンク、メール内容の明確化。
- レート制御/キュー: メール/IP/トークン別に制限、DLQ、監視メトリクス。
- PII 保護: メールアドレスはオンチェーン秘匿、オフチェーンはハッシュ/暗号化。

---

## 10. よくある落とし穴（チェックリスト）
- DKIM 正規化差で検証NG → 生ヘッダ断片と期待ハッシュでテスト固定。
- ヘッダ/本文サイズ過大 → 証明時間が爆増。適切な上限を設定。
- 招待/返信の件名ズレ → 厳格なテンプレとバリデーション、分かりやすい指示文。
- 取消/期限の仕様抜け → Unclaimed に `expiry` を必ず組み込む。UI 上も明記。
- メールプロバイダ差異 → ProtonMail の本文制限、Gmail のエンコード差に注意。

---

## 11. 仕上げの指針（本番想定）
- チェーン: Base 推奨（低コスト/UX良）。
- トークン: USDC から開始、NFT/スワップは拡張で対応。
- 監視: DKIM失敗率、証明時間、Tx成功率、招待→受取の転換率。
- ルール: 高額は 2FA/遅延解除、企業ドメインは許可制。

---

## 12. 次にやること（学習→実装）
- ローカルで Relayer/Prover/DB を起動し、サンプル送金→返信→受取を一周。
- Next.js から `/api/send` を叩き、UI/エラー表示/取消を形にする。
- 証明時間/成功率を計測し、ヘッダ/本文の上限やメールテンプレを調整。
- 必要があれば SDK（Blueprint）で独自メール証明を追加し、拡張機能の礎を作る。

以上で、フロントエンド・Relayer・Prover・スマートコントラクトがどのように連携し、どの順番で実装/起動/統合していくかの全体像が掴めるはずです。困ったら本ファイルに立ち戻り、関連ドキュメント（設計群/Email Wallet/SDK）をピンポイントで参照してください。
