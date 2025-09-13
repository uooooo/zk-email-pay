# DKIM Bypass (Local) — Create Account Flow Deep Dive

This doc explains what the “DKIM bypass (local)” patch does and how it affects the create‑account flow. It compares behavior with and without the patch, and pinpoints the exact files/functions involved across relayer, prover, and contracts. The patch you referenced is:

- docs/patches/email-wallet/feat-dkim-bypass-logs-fallback.patch

Summary: The patch does not remove DKIM verification from the core flow. Instead, it adds SMTP debug logging and a safe fallback in the email intake route so missing/invalid DKIM or parse errors don’t crash the worker. When emails fail to parse (e.g., no DKIM header in local testing), the relayer now sends a helpful error email to the sender and exits early (no proof, no on‑chain call).

## What Changed (Patch Overview)

- SMTP debug logs in the email sender:
  - File: email-wallet/packages/relayer/src/modules/mail.rs:405
  - Adds request/response logging around the SMTP POST to help local debugging:
    - Logs: `SMTP DEBUG request to=... to=... subject=...`
    - Logs: `SMTP DEBUG response status=... body=...`

- Safe fallback in `receiveEmail` API when parsing fails:
  - File: email-wallet/packages/relayer/src/modules/web_server/rest_api.rs:422
  - Key lines: 423–455
    - Previously: `ParsedEmail::new_from_raw_email(&email).await.unwrap();` (panic on failure)
    - Now: captures `Err`, extracts a `From:` address via regex, and sends `EmailWalletEvent::Error` to that address, then returns `Ok(())` without invoking the core handler. This effectively “bypasses” the rest of the flow only in error cases (e.g., no DKIM), preventing crashes and providing feedback.

No changes were made in the core DKIM logic (`check_and_update_dkim`) or the contract call path. If the email parses successfully, DKIM verification/registry updates via the Oracle still run as before.

## Normal Create‑Account Flow (Baseline)

End‑to‑end flow without errors (file/function level):

1) Frontend → Relayer: `POST /api/createAccount`
- Router: email-wallet/packages/relayer/src/modules/web_server/server.rs:197
- Handler: email-wallet/packages/relayer/src/modules/web_server/rest_api.rs:223 (`create_account_api_fn`)
  - Generates an invite email with a subject containing `Code <hex>` if the user is new.
  - Sends via `send_email` (SMTP JSON POST).

2) User replies to the invitation email
- IMAP → Relayer: `POST /api/receiveEmail` with raw MIME
- Router: email-wallet/packages/relayer/src/modules/web_server/server.rs:268
- Handler: email-wallet/packages/relayer/src/modules/web_server/rest_api.rs:422 (`receive_email_api_fn`)
  - Parses MIME: `ParsedEmail::new_from_raw_email(&email)`.
  - Sends an acknowledgement (Ack) to the sender, then spawns `handle_email(email)`.

3) Relayer core handling (Create Account branch)
- Entrypoint: email-wallet/packages/relayer/src/core.rs:19 (`handle_email`)
  - Extracts `from_addr`, confirms invitation code in subject, derives `AccountSalt`.
  - Ensures DKIM registry: `check_and_update_dkim(email, parsed)`
    - File: email-wallet/packages/relayer/src/core.rs:490
    - If the domain’s DKIM public key hash is missing on-chain, the relayer queries the DKIM Oracle (ICP) and sets it on-chain via the registry:
      - Oracle client: email-wallet/packages/relayer/src/modules/dkim_oracle.rs
      - On-chain setter: chain client `set_dkim_public_key_hash` (below)
  - Builds account-creation proof input and calls the Prover:
    - `generate_account_creation_input(&email, RELAYER_RAND)` (from relayer_utils)
    - `generate_proof(input, "account_creation", PROVER_ADDRESS)`
      - File: email-wallet/packages/relayer/src/utils/utils.rs:124 (HTTP POST `{PROVER}/prove/account_creation`)
      - Prover endpoints: email-wallet/packages/relayer/… calls email-wallet/packages/prover/local.py → core.py:6
  - Assembles `EmailProof` and `psi_point` from `pub_signals` and calls the chain:
    - Chain client: email-wallet/packages/relayer/src/chain.rs:157 (`create_account`)
    - Contract path: `AccountHandler.createAccount(accountSalt, psiPoint, EmailProof)`
      - Contract: email-wallet/packages/contracts/src/handlers/AccountHandler.sol:87
      - Verifies DKIM hash, email timestamp, nullifier, and the Groth16 proof via `IVerifier.verifyAccountCreationProof` (Verifier.sol)
    - On success: updates Postgres DB (`users`), auto-claims pending items, emits `EmailWalletEvent::AccountCreated` → sends confirmation email.

4) Storage and network interactions
- Off‑chain DB (Postgres): email-wallet/packages/relayer/src/database.rs
- SMTP send: email-wallet/packages/relayer/src/modules/mail.rs:405 (with DEBUG logs from patch)
- Prover HTTP: email-wallet/packages/prover/local.py (Flask), core.py:6
- DKIM Oracle + Registry (only when needed): core.rs:490 → chain.rs:363

## Flow With This Patch (“DKIM bypass local”)

Only the intake step is adjusted for resilience; the core DKIM/Oracle and on-chain flow are unchanged if parsing succeeds.

- Intake (`receive_email_api_fn`): email-wallet/packages/relayer/src/modules/web_server/rest_api.rs:422
  - New behavior on parse failure (e.g., missing DKIM header in local emails):
    - Extract `From:` header via regex (lines 424–435).
    - Spawn an `EmailWalletEvent::Error` to that address with a helpful message (lines 440–449).
    - Return `Ok(())` early (line 451), i.e., do NOT call `handle_email`.
  - If parsing succeeds, behavior is identical to baseline: send Ack, then call `handle_email`.

- DKIM/Oracle logic when parsing succeeds:
  - Unchanged. `check_and_update_dkim` still checks `ECDSAOwnedDKIMRegistry` and, if missing, calls the DKIM Oracle and sets the key on-chain: email-wallet/packages/relayer/src/core.rs:490 → email-wallet/packages/relayer/src/chain.rs:363.

- SMTP debug:
  - Added request/response logs before/after POST: email-wallet/packages/relayer/src/modules/mail.rs:405 (lines 410–429).

## Diff vs. Without Patch

- Without patch (strict):
  - `receive_email_api_fn` used `unwrap()` on `ParsedEmail::new_from_raw_email`. Any parse/DKIM canonicalization error would panic the handler. No error email is sent; worker instability during local testing is likely.

- With patch (resilient):
  - On parse failure: no panic; attempts to inform the sender via `EmailWalletEvent::Error`, then exits early. No DKIM Oracle call, no proof generation, no contract call in this error path.
  - On parse success: identical to baseline — DKIM registry ensure (oracle + on‑chain) if needed, proof, and `AccountHandler.createAccount` proceed normally.

Important: This patch does not skip DKIM verification inside `handle_email`. It only “bypasses” the hard failure at intake by gracefully handling non‑DKIM or malformed emails in local/hybrid setups. The DKIM path (oracle + registry) still executes when emails are parseable.

## File/Function Reference (Create‑Account Path)

- API
  - `/api/createAccount`: server.rs:197 → rest_api.rs:223 (`create_account_api_fn`)
  - `/api/receiveEmail`: server.rs:268 → rest_api.rs:422 (`receive_email_api_fn`) [patched fallback]

- Core
  - `handle_email(...)`: core.rs:19
  - `check_and_update_dkim(...)`: core.rs:490
  - Subject code masking: core.rs:401 (invitation_code_with_prefix.json)

- Prover
  - Relayer → Prover HTTP client: utils.rs:124 (`generate_proof`)
  - Prover server: packages/prover/local.py (Flask)
  - Proof pipeline: packages/prover/core.py:6 (`gen_account_creation_proof`)

- Contracts
  - Chain client: chain.rs:157 (`create_account`), chain.rs:363 (`set_dkim_public_key_hash`)
  - Account creation: contracts/src/handlers/AccountHandler.sol:87
  - Verifier interface: contracts/src/interfaces/IVerifier.sol:15 → contracts/src/verifier/Verifier.sol

- DB
  - Postgres (off‑chain): relayer/src/database.rs (users, claims, etc.)

## End‑to‑End Flow (With Patch)

1) Frontend → `/api/createAccount` → invitation email sent (SMTP DEBUG logs visible)
2) User replies
3) IMAP → `/api/receiveEmail`
   - If parsing fails (e.g., missing DKIM): send error email to `From:` and exit
   - If parsing succeeds: send Ack → `handle_email`
4) `handle_email`:
   - Ensure DKIM registry (oracle + on‑chain) if needed
   - Generate proof (`account_creation`) via Prover
   - Call `AccountHandler.createAccount` on‑chain
   - Persist user in DB, send confirmation email (SMTP DEBUG logs visible)

## Notes

- If you intended a full “DKIM bypass” (i.e., skip the DKIM Oracle/registry update even when parsing succeeds), that code path does not exist in this patch. The current behavior only hardens intake. Any additional bypass (e.g., env‑gated local signer) would require explicit logic inside `check_and_update_dkim` to avoid calling the oracle and to write a locally signed key hash instead.

