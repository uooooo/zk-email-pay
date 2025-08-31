# PoC 構成デフォルト（推奨設定）

- チェーン: Base Sepolia (`chainId=84532`)
- RPC: 環境のAlchemy/Infura等のBase Sepoliaエンドポイント
- トークン: USDC (Base Sepolia)
  - アドレス: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- DKIM信頼モデル（PoC）: Trusted Fetcher + キャッシュ
  - リレーラーがDNSからDKIM公開鍵を取得して使用（DNSSECは後日）
  - 送信ドメインの許可リストを運用で制限可能
- メールプロバイダ（PoC）: Gmail（IMAP/SMTP、有効なApp Password）
  - IMAP: `imap.gmail.com:993`
  - SMTP: `smtp.gmail.com:587`
  - 備考: IMAP有効化・2段階認証＋アプリパスワード必須
- 通知Fromドメイン（PoC）: 同一Gmailアカウント（専用アドレスを推奨）
- リレーラー鍵管理（PoC）: `.env` にホットキー（後日KMS/HSMへ移行）
- ガス/料金: Relayerが肩代わり（`FEE_PER_GAS=0` でPoC運用）。

.env 例（services/relayer/.env）
```
CORE_CONTRACT_ADDRESS=0x...
CHAIN_ID=84532
CHAIN_RPC_PROVIDER=<<Your Base Sepolia RPC>>
PRIVATE_KEY=0x...
IMAP_DOMAIN_NAME=imap.gmail.com
IMAP_PORT=993
SMTP_DOMAIN_NAME=smtp.gmail.com
LOGIN_ID=relayer@example.com
LOGIN_PASSWORD=app-password
PROVER_ADDRESS=http://127.0.0.1:8080
DATABASE_URL=postgresql://emailwallet:p@ssw0rd@localhost:5432/emailwallet
FEE_PER_GAS=0
```

注意:
- Proton Mailは本文の原文取得に制限があり、Registry系の検証では制約あり（Email Walletの送受信は可）。
- 本番移行時はDNSSECまたは`ECDSAOwnedDKIMRegistry`等の強化を検討。
