## 概要
このリポジトリは、メールアドレス宛にステーブルコイン等を送る「zk-email-pay」プロジェクトの設計/実装を支援するためのエージェント初期設定です。開発者・AIコーディングエージェント双方に共通のルール、タスク運用、ビルド/実行方法を提示します。

## 技術スタック
- アプリ: Next.js App Router / TypeScript
- UI: Tailwind CSS / shadcn
- デプロイ: Vercel
- パッケージマネージャ: Bun 推奨（bun.lockb 同梱）。npm/yarn も可だが基本は `bun` を使用。
- スマートコントラクト: Foundry（forge）
- バックエンド: Email Wallet Relayer/Prover（Node/Python + Docker）

## タスク管理
- GitHub Issues と `/task/*.md` を併用
- タスクMarkdown準拠（見出し: 概要/背景/やること/受入基準/参考）
- 大きな課題は Epic（Issue + リンク集）化し、小タスクを分割

## ランタイム / ビルド
- 推奨コマンド: `bun install`, `bun run dev`, `bun run build`, `bun run lint`
- ローカル開発: ユーザー側で開発サーバを起動（CI は build/lint/test のみ）
- .env: `.env.local`（Web）, `packages/relayer/.env`（Relayer）など用途別に分割。秘匿情報は共有しない。

## ディレクトリ設計（ベストプラクティス/現状準拠）
- `frontend/` … Next.js（App Router, TS）
  - `src/app/`（ルーティング）, `src/components/`, `src/lib/`, `src/styles/`
  - `.env.local` はここで管理（公開値は `NEXT_PUBLIC_`）
- `contracts/` … Foundry（`src/`, `test/`, `script/`）
- `packages/relayer/` … Relayer サービス（IMAP/SMTP, API, DB）
- `packages/prover/` … Prover サービス（ZK証明生成）
- `packages/utils/` … 共有ユーティリティ（型/共通処理）
- `docs/` … 設計/仕様/学習資料（本プロジェクトは `docs/product/zk-email-pay/` 配下）
- `task/` … タスクMarkdown（Issueと相互リンク）
- `scripts/` … 開発/運用スクリプト（DB初期化, デプロイ補助 等）
- `.github/` … Issue/PR テンプレート、ワークフロー（CI）

注: すでに `frontend/` と `task/` を導入済み。以後この構成に揃え、過度な階層化は避ける。

## 開発ルール
- TypeScript: `strict: true` 前提、ESLint/Prettierを有効化
- UI: コンポーネントは `src/components/` に集約、ステートは最小化
- API 通信: 失敗時のエラー表示を統一（トースト/バナー）。再試行/サポート導線を明示。
- 環境変数: `NEXT_PUBLIC_` 接頭辞の公開変数と秘密変数を明確に分離
- セキュリティ: 秘密鍵/トークンの直書き禁止。メール/PII はハッシュ/マスキングで保存。
- ドキュメント: 設計変更は `docs/product/zk-email-pay/` に反映し、関連PRにリンク

## Git 運用ルール（Issue駆動）
- 起票: 開発は GitHub Issue 単位で行う。`task/` に対応するタスクMDを作成し、Issue からリンク（双方向）。
- ブランチ命名: `<type>/<issue-number>-<slug>` 例: `feat/123-send-to-email`, `fix/456-proof-retry`
- 取得/更新:
  - `git fetch origin` → `git switch -c feat/123-send-to-email origin/main`
  - 作業中は定期的に `git pull --rebase origin main`
- コミット: Conventional Commits 準拠＋Issue参照 例: `feat(send): add /api/send (#123)`
- PR: Draftで早期に作成→ラベル/Assignee/Reviewer設定→説明はMarkdown（概要/変更点/影響/テスト/関連Issue）
- リンク: PR本文に `Closes #123` を必ず記載（マージ時に自動クローズ）
- CI: lint/test/build を必須。落ちたら直すか理由を記載. 基本的にはlintを使用しpush前にbuildを行う
- リリース: タグ `vX.Y.Z` を付与し、リリースノートを自動生成（CI設定がある場合）

## テスト方針
- 単体テスト: UI（React Testing Library）、contracts（forge test）
- 結合テスト: Relayer API 経由のフロー（モック/スタブを活用）
- E2E（任意）: Playwright で主要ユーザーフロー（送金→受取）

## PR 作成ルール
- タイトル・本文は Markdown で記述（本文内で `\n` のような生エスケープ文字を埋め込まない）
- 本文テンプレ: 概要、変更点、影響範囲、テスト観点、関連 Issue/タスク、スクショ/ログ
- 小さく出す: 1PR の論点は1つに絞る（UI/仕様変更はスクショ・gif 添付）
- CI: lint/test/build を通すこと（壊れている場合は理由と今後の対応を明記）

## ブランチ戦略 / バージョニング
- ブランチ: `main`（保護） / `feat/<issue>-<slug>` / `fix/<issue>-<slug>` / `docs/<issue>-<slug>`
- タグ: リリース時に `vX.Y.Z`
- コミット規約: Conventional Commits（feat/fix/docs/chore/refactor/test/build）

## 環境/デプロイ
- 環境: dev/stg/prod を明確に分離（RPC/コントラクトアドレス/Relayer URL も分離）
- デプロイ: Vercel（Preview → Production）。環境変数は Vercel UI で管理
- Relayer/Prover: Docker でデプロイ。Secrets は Vault/環境ごとに管理

## セキュリティ・運用
- レート制限・監視: 送信/受信メール、証明時間、Tx 成功率をメトリクス化
- インシデント: 影響/暫定対応/恒久対策/再発防止をタスク化（/task に記録）
- キー管理: Relayer の秘密鍵はKMS/HSM、ローテーション計画を持つ

## AI エージェントの使い方
- 仕様理解: まず `docs/product/zk-email-pay/Developer-Handbook.md` と `docs/zkemail/zk-email-overview.md` を参照
- 設計変更: 変更時は設計ドキュメントも更新し PR に含める
- 外部ドキュメント: Context7 を用いて規格/依存の最新仕様を参照
- serena MCPを使用しコンテキストを効率的に理解する

## 参考
- 設計: `docs/product/zk-email-pay/*`
- zk-email: `docs/zkemail/*`
- ペルソナ: `docs/user/persona.md`
