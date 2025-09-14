# IMAP Header Integrity (Gmail) — Ensuring DKIM Headers Reach the Relayer

Account creation and send/claim flows require the reply email’s `DKIM-Signature` header (incl. `d=`, `s=`, `bh=`, `b=`). If the IMAP bridge drops headers, the relayer cannot parse inputs and may log errors like `NoKeyForSignature`.

This note summarizes how to keep headers intact end-to-end.

## Symptoms

- Relayer logs show:
  - `Failed to parse email: NoKeyForSignature`
  - Or earlier: `No DKIM-Signature header`
- On-chain DKIM registry update succeeds (via IC or local bypass), but `createAccount` never runs (no "account creation tx hash" log), and `isAccountCreated` stays `false`.

## Root Cause

- The IMAP → HTTP bridge posts a sanitized payload (e.g., `BODY[TEXT]`) without the original headers, or forwards MIME parts without the envelope.
- The relayer needs the full RFC822 message: headers + body.

## Requirements

- Gmail account with IMAP enabled and App Password.
- IMAP fetch must request the full raw message:
  - Use `RFC822` or `BODY.PEEK[]` (not `BODY[TEXT]`).
  - The posted HTTP payload must be the raw RFC822 data as-is.

## Options

1) Use the upstream `relayer-imap` (recommended) and confirm headers are kept
   - The Docker `imap` service in this repo builds `zkemail/relayer-imap` and posts to `RELAYER_ENDPOINT`.
   - Validate from the container:
     - Update compose to include `extra_hosts: ["host.docker.internal:host-gateway"]` (already applied here) so it reaches the host.
     - Ensure it posts raw message (payload size matches Gmail raw size; DKIM-Signature present).

2) Roll your own minimal IMAP poller
   - Example: `legacy/scripts/imap_poller.py` (adjust to fetch `RFC822` and POST bytes).
   - Python IMAP pseudocode:
     ```python
     import imaplib, requests
     M = imaplib.IMAP4_SSL('imap.gmail.com')
     M.login(USER, APP_PASSWORD)
     M.select('INBOX')
     typ, data = M.search(None, '(UNSEEN)')
     for num in data[0].split():
         typ, msg_data = M.fetch(num, '(RFC822)')   # not BODY[TEXT]
         raw = msg_data[0][1]
         requests.post('http://host.docker.internal:4501/api/receiveEmail',
                       data=raw, headers={'Content-Type': 'text/plain'})
     ```

3) Gmail API (messages.get) with `format=raw`
   - Alternative to IMAP. Fetch the `raw` payload (base64url), decode, and POST to `/api/receiveEmail`.

## Do Not

- Do not post only the body text or pre-parsed JSON. The relayer will fail to construct circuit inputs.
- Avoid manual copy/paste of raw EML for routine testing; use an automated poller to preserve headers.

## Quick Checks

- `curl -X POST http://127.0.0.1:4501/api/receiveEmail --data-binary @sample.eml -H 'Content-Type: text/plain'`
  - If this succeeds (no parse error), your relayer is fine; the issue is the bridge payload.
- Add temporary logging (already present) and confirm subjects and DKIM presence in relayer logs.

