# 返信メールの扱い（confirm と zkemail プロトコル）

このメモは、`test-mail` で送信する「返信で確認してください（confirm）」型のメールが、zkemail/Email Wallet の本番 Relayer においてどのように扱われるかを整理します。

## 結論（要点）
- 本番の zkemail Relayer は、ユーザからの「返信メール」自体を本文で判定しません。判定対象は主に「件名（Subject）」と DKIM 署名です。
- 件名にコマンド（例: `Send 10 TEST to bob@example.com`）が含まれていれば、その返信は「確認（confirm）」として扱われ、オンチェーン実行に進みます。
- 件名先頭に `Re:` が付いていても、コマンド語（`Send` など）の位置を特定してパースするため問題ありません。
- 返信本文に `confirm` と書く必要はありません（本文は未参照）。重要なのは「件名がコマンド形式であること」と「DKIM 検証が通ること」です。

## 受信～実行の流れ（簡略）
1. Relayer は受信メールを取り込み、DKIM 署名検証・送信者ドメインの公開鍵ハッシュ更新などを行います。
2. 送信者のメールが既に登録済みであることを確認（未登録ならエラー返信）。
3. 件名からコマンドを抽出（`Send`, `Execute`, `Install`, など）。`Re:` などの接頭辞はスキップします。
4. コマンド・パラメータ（数量・トークン名・宛先など）を件名から構文解析。
5. ZK 証明を生成し、オンチェーンにブロードキャスト（`handle_email_op`）。
6. 結果に応じてユーザへ通知メール（完了/エラー等）。

参考：実装は `email-wallet/packages/relayer/src/core.rs`（`handle_email`）および `src/utils/subject_templates.rs` のコマンド抽出/解析にあります。受信エントリは `src/modules/web_server/rest_api.rs` の `receive_email_api_fn` です。

## 「返信で確認」パターンの意味
- Web/API からリクエストを開始した場合（`send_request.html` など）、ユーザに「この件名で返信してください」と案内します。
- ユーザがそのメールに返信（件名が `Re: Send ...` など）すると、Relayer は受信メールの件名を解析し、オンチェーン実行します。
- 確認は「返信したこと（＝メール往復）」と「件名が正しいコマンド形式」および「DKIM 検証」が鍵であり、本文中の `confirm` 文字列は不要です。

## 受理の必須条件
- DKIM 検証が成功すること（DKIM なしや異常なメールは弾かれます）。
- 送信者メールアドレスが既に登録済みであること。
- 件名がサポートされるコマンド形式であること。
  - 例: `Send 10 TEST to bob@example.com`、`Send 5 USDC to 0x1234...` など。
  - `Re:` 付きでも OK（先頭でない位置にあるコマンド語を検出）。

## test-mail での注意
- `test-mail` は送信専用の最小ツールで、受信処理（IMAP/SMTP 取り込み→`receive_email_api_fn` 呼び出し）は持っていません。
- したがって、`test-mail` + Mailpit だけでは「返信→オンチェーン実行」までは繋がりません（Mailpit は受信箱として可視化するのみ）。
- 実際に confirm フローまで動かすには、本体 Relayer（IMAP/SMTP 連携と `receive_email_api_fn` 実行）を起動する必要があります。

## 例：推奨される件名
- `Send 10 TEST to bob@example.com`
- `Send 5 USDC to 0xAbCdef...`

この件名でユーザが返信すれば、本文に `confirm` が無くても実行されます。

---

補足: 詳細なコード参照やシーケンスが必要であれば、`docs-konaito/emails.marp.md` の「発火点」スライドと、Relayer の `core.rs`/`subject_templates.rs` を併せて確認してください。

