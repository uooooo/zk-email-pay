# zk-email-pay: メールアドレス宛にステーブルコインを送るプロダクト設計

本フォルダは、本プロダクト（メールアドレスを“支払いの宛先”として機能させ、受取者がウォレット未保有でもガスレスで受け取れる体験）の技術要件・アーキテクチャ・仕様をまとめた設計ドキュメント群です。

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

