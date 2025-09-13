# Troubleshooting: DKIM + E2E Hybrid Test (Local)

This note documents what we changed, why errors occurred, and a reproducible path to green for local hybrid testing (Gmail reply → DKIM → prover → on‑chain).

## TL;DR (Current Working Dev Setup)

- Core proxy: `CORE_CONTRACT_ADDRESS` points to the EmailWalletCore proxy (verified via `accountHandler()` call).
- DKIM registry update: In dev, enable a bypass to sign the registry message locally instead of calling the IC oracle.
- Prover: Use local Flask prover at `http://127.0.0.1:8080` with snarkjs + params extracted.
- DB/SMTP: Run Postgres and SMTP via docker-compose.

## What We Fixed/Changed

- Instrumented relayer to print DKIM details just before registry update:
  - Logs include `DKIM DEBUG oracle.selector`, `oracle.domain`, `oracle.public_key_hash`, `oracle.signature`, and the final `signed_msg` string.
  - File: `email-wallet/packages/relayer/src/core.rs`

- Added a dev bypass to skip IC DKIM oracle and sign locally:
  - `DKIM_BYPASS_LOCAL_SIGN=true` signs the message with `DKIM_LOCAL_SIGNER_PK` (defaults to relayer `PRIVATE_KEY`).
  - With bypass on, on‑chain registry signer should be the relayer EOA (for local testing only).

- Verified CORE proxy correctness:
  - `cast call <CORE> "accountHandler()(address)"` returns a valid AccountHandler proxy.
  - `cast call <AccountHandler> "defaultDkimRegistry()(address)"` and `cast call <Registry> "signer()(address)"` show expected signer.

- Brought up local dependencies:
  - Postgres and SMTP via `email-wallet/docker-compose.yaml`.
  - Local prover Flask at `:8080`.

## Why The Original Errors Happened

1) Invalid signature (setDKIMPublicKeyHash)
- The IC DKIM oracle returned signatures that recovered to different EVM addresses across calls, while the on‑chain registry expects a single fixed signer.
- Result: `ECDSAOwnedDKIMRegistry.setDKIMPublicKeyHash` reverted with “Invalid signature”.

2) IC HTTPS outcalls error
- Switching to the documented canister ID in your environment hit IPv6 outcall errors (IC path not reachable from host).
- Confirmed by relayer log: canister `http_request` error connecting to `dns.google`.

3) No DKIM-Signature header
- Some processed emails lacked DKIM-Signature headers (non‑DKIM messages), causing the DKIM library to panic. This is unrelated to Gmail↔Gmail replies with DKIM:PASS.

4) Prover 500 (local)
- Local prover returned 500 until snarkjs and circuit params (`params/`) were present and accessible by the proofgen script.

## Repro Steps (Local Hybrid Test)

1) Contracts (local, anvil)
- Ensure `email-wallet/packages/contracts/.env` is set for local dev.
- Deploy via DefaultSetupScript. Use the Core proxy printed in the logs.

2) Relayer config
- `email-wallet/packages/relayer/.env` (key items):
  - `CORE_CONTRACT_ADDRESS=<EmailWalletCore proxy>`
  - `WEB_SERVER_ADDRESS=0.0.0.0:4500`
  - `PROVER_ADDRESS=http://127.0.0.1:8080`
  - `DKIM_BYPASS_LOCAL_SIGN=true`
  - `DKIM_LOCAL_SIGNER_PK=<relayer private key>` (optional)
  - Keep IC vars set but they are unused when bypass is on.

3) Services
- Start DB + SMTP:
  - `cd email-wallet && docker compose up -d db smtp`
- Start prover:
  - `cd email-wallet/packages/prover`
  - `npm install -g snarkjs@latest` (one‑time)
  - `unzip -o params.zip -d params` (one‑time)
  - `python3 -u local.py`

4) Relayer
- `cd email-wallet/packages/relayer && cargo run --release`
- Health: `curl http://localhost:4500/api/echo` → `Hello, world!`

5) Flow
- Create account: `POST /api/createAccount {"email_addr":"<your_gmail>"}` (relayer emails you an invitation code)
- Reply to the Gmail email (UNSEEN, no edits) OR simulate locally by posting a DKIM-signed sample `.eml` to `/api/receiveEmail`.
- Relayer logs should show:
  - `DKIM DEBUG (bypass) signer=0x... signed_msg=SET:selector=20230601;domain=gmail.com;public_key_hash=0x...;`
  - Proof generation call to local prover.
- Check: `POST /api/isAccountCreated {"email_addr":"<your_gmail>"}` → `true`

6) Send flow
- `POST /api/send { email_addr, amount, token_id, recipient_addr, is_recipient_email }` → email prompt, then reply.

## CORE_CONTRACT_ADDRESS Validation Checklist

- `cast call <CORE> "accountHandler()(address)"` returns non‑zero.
- `cast call <CORE> "tokenRegistry()(address)"` returns non‑zero.
- `cast code <CORE>` returns non‑`0x`.

If these pass, you are calling the Core proxy (not the implementation).

## Notes

- Bypass mode is for dev only. For canonical DKIM, the IC oracle and wallet canister must produce signatures from the documented signer and the HTTPS outcalls path must be reachable.
- SMTP “Invalid email domain” errors do not affect chain flow; they only impact outgoing mail delivery. Use local Mailpit or relaxed SMTP in dev.

## Appendix: Key Files

- Relayer DKIM flow: `email-wallet/packages/relayer/src/core.rs`
- Web server routes: `email-wallet/packages/relayer/src/modules/web_server/server.rs`
- Prover (local): `email-wallet/packages/prover/local.py`, `core.py`, `circom_proofgen.sh`

