# zk-email-pay: メールアドレス宛にステーブルコインを送るプロダクト設計（Legacy v1）

本フォルダは v1（POC/自前実装）時点の設計ドキュメント群です。v2（上流 email-wallet 採用）の計画は `docs/product/zk-email-pay.v2/` および `docs/engineering/zk-email-pay/plans.v2/*` を参照してください。

参考資料（ローカル）:
- zk-email 教科書: `docs/zkemail/zk-email-overview.md`
- Email Wallet 一式: `docs/zkemail/zkemail-emailwallet/*`
- ZK Email アーキテクチャ: `docs/zkemail/zkemail-architecture/*`
- ペルソナ: `docs/user/persona.md`

目次:
- requirements.md: 非機能/機能要件と成功指標
- architecture.md: システム構成と全体アーキテクチャ
- flows.md: ペルソナ別ユーザーフロー（送金/受取/取消）
- contracts.md: コントラクト設計とオンチェーン仕様
- backend.md: リレーヤー/プルーバ/メール連携、ガスレス基盤
- api.md: アプリ↔リレーヤーのAPI仕様
- data-models.md: オフチェーンDB/イベントのデータモデル
- security.md: セキュリティ/プライバシー/脅威モデル
- ops.md: 運用、監視、テレメトリ、設定
- roadmap.md: 段階的実装計画
