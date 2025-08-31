# データモデル（オフチェーン/オンチェーン）

## オフチェーン（PostgreSQL 例）

1) accounts
- id (pk), email_hash, wallet_address, created_at, updated_at
- status: created|initialized|transported
- last_relayer_rand_hash

2) payments
- id (pk), sender_email_hash, recipient_email_hash (nullable), recipient_email_commit, token (USDC), amount, expiry, memo, status (created|notified|claimed|cancelled|expired|failed), unclaimed_id (onchain key), tx_hash_create, tx_hash_claim, created_at, updated_at

3) emails
- id (pk), direction (in|out), to, from, subject, dkim_domain, selector, timestamp, raw_path/blob_ref, parsed_fields(jsonb), status (queued|sent|failed|received|parsed)

4) relayer_jobs
- id (pk), type (prove|send_tx|notify), payload(jsonb), status (queued|running|done|failed|retry), attempts, last_error, created_at, updated_at

5) limits
- id (pk), scope (email|ip|token), key_hash, period, limit, used, reset_at

## オンチェーン（イベント/状態）
- UnclaimsHandler: `UnclaimedCreated(id, recipientCommit, token, amount, expiry)`, `UnclaimedClaimed(id, wallet, tx)`, `UnclaimedCancelled(id)`
- AccountHandler: `AccountCreated(emailPointer, wallet)`, `AccountInitialized(wallet)`
- Core: `EmailOpHandled(opHash, domainHash, selectorHash, commandCommitment, timestamp)`

注: メールアドレスは平文で保存しない（ハッシュ/ポインタ）。必要に応じ暗号化（KMS）。

