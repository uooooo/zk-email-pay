# Submodule Fork & Push (email-wallet)

目的: サブモジュール `email-wallet` のローカル変更をフォーク先に push し、親リポの submodule ポインタ更新へつなげる。

## 変更内容（サブモジュール内）

- ブランチ: `feat/dkim-bypass-logs-fallback`
- 変更ファイル:
  - `packages/relayer/src/modules/mail.rs`（SMTP DEBUG ログ）
  - `packages/relayer/src/modules/web_server/rest_api.rs`（receiveEmail フォールバック）
  - `.gitignore`（`params.zip`/`.env.localdev` などを除外）
- コミット: `23eb316f6fd479944a7bd1bf4fbc5dd895f0dc5b`

## 手順 A: GitHub UI でフォーク → CLI で push

1. GitHub 上で `zkemail/email-wallet` を自分のアカウントに Fork（例: `uooooo/email-wallet`）。
2. 端末で以下を実行:

```bash
cd email-wallet
git remote add fork https://github.com/uooooo/email-wallet.git   # フォークURLに置換
git push -u fork feat/dkim-bypass-logs-fallback
```

3. （オプション）上流へ PR を作成（fork → upstream `zkemail/email-wallet`）。
   - 注意: 内部利用のみの場合は PR を作らず、親リポの submodule ポインタを自分の fork/branch のコミットへ向ける運用で問題ありません。

## 手順 B: gh CLI でフォーク（任意）

```bash
cd email-wallet
gh repo fork zkemail/email-wallet --remote=fork --clone=false
git push -u fork feat/dkim-bypass-logs-fallback
```

## 手順 C: パッチ/バンドルでの受け渡し（代替）

- パッチファイルを同梱: `docs/patches/email-wallet/feat-dkim-bypass-logs-fallback.patch`

```bash
cd email-wallet
git checkout -b feat/dkim-bypass-logs-fallback
git am ../../docs/patches/email-wallet/feat-dkim-bypass-logs-fallback.patch
git push -u fork feat/dkim-bypass-logs-fallback
```

（バンドル方式を使う場合は `git bundle create` / `git bundle unbundle` を利用）

## 親リポの submodule ポインタ更新（上流 PR なし運用）

フォーク側にブランチを push 後、親リポで submodule ポインタを更新:

```bash
cd email-wallet
git fetch fork && git checkout feat/dkim-bypass-logs-fallback
cd ..; git add email-wallet
git commit -m "chore(submodule): point submodule to fork email-wallet@feat/dkim-bypass-logs-fallback"
git push
```

その後、この親リポのブランチから PR を作成。
