---
marp: true
paginate: true
title: zk-email-pay におけるメール検証
description: 返信は「件名だけ」ではなく DKIM + ZK 証明で検証する
---

# 概要

- 目的: 本人の正当なメールのみをオンチェーン実行として受理
- 入力: 生メール（ヘッダ/件名/本文）、DKIM 署名、送信ドメイン
- 出力: 検証済みコマンド + ZK 証明 + オンチェーントランザクション
- 実行主体: Relayer（Rust）が解析→証明生成→コントラクトへ送信

---

## 検証パイプライン（高レベル）

1) 受信メールの解析（From/Subject/DKIM 等）
2) DKIM 検証とドメイン鍵ハッシュのレジストリ同期（必要ならオンチェーン登録）
3) 件名 → コマンド抽出とパラメータ構文解析
4) ZK 証明（email_sender / account_creation）を生成（公開信号を含む）
5) `EmailOp` を構築・ローカル検証し、オンチェーンにブロードキャスト
6) 結果通知（受領/成功/エラー）

---

## 解析と正規化

- エントリ: `receive_email_api_fn` が生メールを受理
- `From` を抽出（失敗時は正規表現でフォールバック）
- 件名の正規化:
  - `Re:` 等の接頭辞を考慮し、コマンド語の位置へスキップ
  - 受取人メールが件名に埋め込まれる場合はコミット生成用にマスク
- 解析に失敗した場合はユーザへ親切なエラーメールを返送

---

## DKIM 検証（件名だけではない）

- `check_and_update_dkim` がメールの selector/domain から公開鍵ハッシュを計算
- 未登録なら DKIM Oracle（IC canister）に問い合わせてハッシュをオンチェーン登録
- ZK 証明に `dkim_public_key_hash` / `domain` / `timestamp` を含める
- コントラクト側は証明の DKIM ハッシュがオンチェーンのレジストリと一致することを検証

示唆: 件名が正しくても DKIM が正当でなければ受理されません。

---

## 件名 → コマンド抽出

- 正規化済み件名からコマンド語を探索:
  - 標準コマンド: `Send`, `Execute`, `Install`, `Uninstall`, `Exit`, `Dkim`, `Safe`
  - または拡張コマンド（オンチェーンからテンプレ取得）
- コマンド決定後、テンプレに基づきパラメータを構文解析:
  - 例: `{tokenAmount}`, `{recipient}`, `{address}`, `{string}`
- `Re:` は問題なし。最初に見つかったコマンド語の位置からスライスして解析

---

## ZK 証明生成

- 使用回路: `account_creation` / `email_sender`
- 公開信号（例）:
  - `dkim_public_key_hash`, `timestamp`, `email_nullifier`, `domain`
- 直観的な保証:
  - 「この件名/コマンドは、当該ドメインの DKIM 正当メールに由来する」
  - 「解析されたパラメータは件名の内容と整合する」
- Relayer は解析結果 + 証明で `EmailOp` を組み立て、ローカル検証後にコアコントラクトへ送信

---

## アカウント紐付けと受取コミット

- 送信者の紐付け:
  - `AccountSalt = f(PaddedEmailAddr(From), AccountCode)`
  - 送信メールアドレスが登録済みで、AccountCode と一致するか確認
- 受取人がメールの場合: パディング済み受取メール + 署名からコミットを生成

---

## リプレイ耐性

- `email_nullifier` を証明/公開信号に含め、同一メールの再利用を拒否
- コントラクト/Relayer の両方でチェック
- 必要に応じて DB 側でも補助的なガード（例: unclaim ID）

---

## 検証するもの / しないもの

- 検証する:
  - DKIM 署名とオンチェーンのドメイン鍵ハッシュの一致
  - 件名のコマンド + パラメータの構文解析
  - 件名/ドメイン/タイムスタンプ/ヌリファイアを結びつける ZK 証明
- 依拠しない:
  - 本文の「confirm」などのキーワード
  - DKIM/From/Subject 以外の任意ヘッダ

要点: 「件名だけ」ではありません。件名は解析しますが、受理は DKIM + ZK 証明が前提です。

---

## 返信で確認（コンテキスト）

- Web/API から「返信で確認」メールを送付（件名テンプレを含む）
- ユーザが返信（件名に `Re:` が付く場合あり） → 件名コマンドを解析して実行
- 本文は基本的に無関与（confirm と書く必要はない）

---

## ローカル検証の注意

- `test-mail` は送信専用。受信側の検証（DKIM/証明生成/実行）は行いません。
- エンドツーエンドで検証するには Relayer を起動（SMTP/IMAP 取り込み → `receive_email_api_fn` → 証明 → チェーン）

---

## 参考コード

- 受信・ACK: `email-wallet/packages/relayer/src/modules/web_server/rest_api.rs`
- 中核の検証/証明: `email-wallet/packages/relayer/src/core.rs`
- 件名パース/テンプレ: `email-wallet/packages/relayer/src/utils/subject_templates.rs`
- DKIM レジストリ更新: `core.rs::check_and_update_dkim`
