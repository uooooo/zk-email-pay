## メールアドレスだけの受取人が資産を引き出すフロー（withdraw）

対象: 受取人は「メールアドレスウォレット」しか持っていない（EOA/ブラウザウォレット未所持）。他者からメール宛てに送られた資産を、自分の管理下に引き出すまでの手順をまとめます。

本フローは `vendor/email-wallet` の設計（Unclaims/Claim、account creation/init、email_sender 回路）に基づきます。

---

### A. 受取時点の状態
- 送金者が「Send ... to your@email」形式で送信すると、チェーン上では以下のいずれかになります。
  - 受取人ウォレットが未作成: 資産は Unclaims（未請求）としてロック。キー: 受取メールアドレスのコミット（`email_addr_commit`）。
  - 受取人ウォレットが既に作成済み: 受取人ウォレットに直接反映。

以降は「未作成」ケースを中心に説明します。

---

### B. アカウント作成/初期化（初回のみ）
Claim 実行には、受取人のメールアドレスに紐づくウォレット（Account）が存在する必要があります。

1) 招待メールの受領（Relayer から自動送付）
- 初見の受取メールアドレスに対し、Relayer は Invitation（`account_created.html`/`invitation.html` 類）を送付します。
- 招待メールは後段の Liveness 証明に使うため保管してください。

2) アカウント作成/初期化
- 招待メールに従い、アカウント作成（`account_creation`）→初期化（`account_init`）を完了します。
- これにより、受取人メールから導出される `account_salt`（ウォレットアドレスの種）が確定します。

※ 初回セットアップは Relayer がガイドします（API: `/api/genAccountCode` `/api/createAccount` `/api/isAccountCreated`）。

---

### C. 未請求資産のクレーム（ZK 証明）
目的: Unclaims にロックされた資産を、受取人のウォレット（`account_salt` 由来）へ移す。

前提情報
- `email_address`: 受取人のメールアドレス
- `random`: 送金時にメールアドレスコミットへ用いられた乱数（cm_rand）。
- `tx_hash`: 当該 Unclaim を生んだトランザクションハッシュ
- `expiry_time`: クレーム期限
- `is_fund`: 資産（fund）か状態（state）かの別

手順
1) クレーム要求の送出（フロント/REST）
- Relayer API に POST（例） `/api/unclaim`
```json
{
  "email_address": "you@example.com",
  "random": "0x...",              // 受取コミット用乱数（cm_rand）
  "tx_hash": "0x...",             // Unclaim を生んだ Tx
  "expiry_time": 1720000000,
  "is_fund": true
}
```

2) 証明生成（Prover）
- 回路: `claim.circom`
- 入力: `recipient_email_addr`、`recipient_relayer_rand`、`cm_rand`（= random）
- 公開値: `recipient_relayer_rand_hash`、`recipient_pointer`、`recipient_email_addr_commit`

3) オンチェーン検証→反映
- コントラクトは ZK 証明を検証し、Unclaims → 受取人ウォレットへ移転。
- 成功時、Relayer は「Claimed」系メールを送付します（`claimed_fund.html` 等）。

注記
- `random` の授受方法は Relayer 実装/運用に依存します。開発環境では PSI（`/api/serveCheck` `/api/serveReveal`）や安全な外部チャネルで伝達します。
- `expiry_time` を過ぎると `void`（没収/無効化）されるため、期限前にクレームが必要です。

---

### D. 外部アドレスへ引き出し（withdraw）
資産が自分のメールウォレットに入った後、EOA（0x...）など外部アドレスに送る手順です。

方法1: メールのみで送金（推奨）
1) 受取人が Relayer 宛にメール送信（件名コマンド）
- 例: `Send 100 USDC to 0xabc...`（ETH の場合: `Send 0.1 ETH to 0xabc...`）
2) 回路: `email_sender.circom` で DKIM + 件名検証（受取アドレスは公開）
3) コントラクトがウォレットから指定アドレスへ送金

方法2: オーナー移譲してから任意操作
1) メールでオーナー移譲コマンド
- 例: `Exit Email Wallet. Set owner to 0xowner...`
2) 以後はその EOA が `Wallet.sol` を直接操作（ユーザ署名で任意送金/引き出し）。

---

### E. 失敗時の確認ポイント
- アカウント未作成: C のクレーム前に B を完了してください。
- 期限切れ: `expiry_time` 超過で `claim` 不可（`void` の対象）。
- `random` 不一致: 送金時のコミット乱数（cm_rand）が相違。再取得（PSI/運営ヘルプ）。
- DKIM/時刻ズレ: 受信サーバ差異や時刻窓の制約で失敗することがあります。リトライ/正規化。

---

### F. よくある質問
- Q: ウォレット未作成でもクレームできますか？
  - A: いいえ。まず招待メールに従ってアカウント作成/初期化（B）を完了してください。
- Q: メールだけで外部アドレスへ引き出せますか？
  - A: はい。方法1 の件名コマンド（Send ... to 0x...）で可能です。
- Q: `random` はどこで入手しますか？
  - A: 運営が提供する PSI 経由の開示、または安全なチャネルで送金者/Relayer から共有されます（環境依存）。

---

更新: 2025-09-04
