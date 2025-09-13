# Email Wallet Create Account Flow (Deep Dive)

This document explains, at file/function level, how Email Wallet (email-wallet) handles “create account”: from the API request, through the invitation email, the user’s reply, proof generation, to on‑chain wallet deployment. It also clarifies the DB layer (off‑chain Postgres) and pinpoints where smart contracts are called.

## TL;DR
- Frontend calls relayer `POST /api/createAccount` with `{ email_addr }`.
- Relayer sends an invitation email to the user: subject includes a unique “Code <hex>”.
- User replies to that email (blank reply is fine).
- IMAP service posts the raw email to relayer `POST /api/receiveEmail`.
- Relayer parses the email, ensures DKIM registry is up to date, extracts the invitation code, generates an `account_creation` proof via the Prover, and calls `AccountHandler.createAccount` on‑chain.
- Relayer stores user in its Postgres DB and sends a “Your account is created” email.

## Components Involved

- Relayer (Rust): server/API, email processing, chain client, DB persistence.
  - Web server routes: `email-wallet/packages/relayer/src/modules/web_server/server.rs`
  - API handlers: `email-wallet/packages/relayer/src/modules/web_server/rest_api.rs`
  - Core email logic: `email-wallet/packages/relayer/src/core.rs`
  - Chain client (ethers-rs): `email-wallet/packages/relayer/src/chain.rs`
  - Email out (SMTP): `email-wallet/packages/relayer/src/modules/mail.rs`
  - Database (Postgres via sqlx): `email-wallet/packages/relayer/src/database.rs`
  - Utils (proof call, PSI point): `email-wallet/packages/relayer/src/utils/utils.rs`
- Prover (Python/Flask): `email-wallet/packages/prover/local.py`, `email-wallet/packages/prover/core.py`
- Smart Contracts (Foundry):
  - `AccountHandler.createAccount`: `email-wallet/packages/contracts/src/handlers/AccountHandler.sol`
  - Verifiers: `email-wallet/packages/contracts/src/verifier/Verifier.sol`
  - DKIM Registry: `email-wallet/packages/contracts/src/utils/ECDSAOwnedDKIMRegistry.sol`

## DB Clarification (Off‑chain)

- The “DB” used by the relayer is an off‑chain Postgres instance you run locally (e.g., via docker compose).
- Compose service name and connection string are wired in env files and the relayer `.env`. Example in `email-wallet/docker-compose.yaml` and `email-wallet/packages/relayer/.env`.
- The schema is created on startup by `Database::setup_database`:
  - `users(email_address PK, account_code, tx_hash, is_onboarded, wallet_addr)`
  - `claims(...)` for unclaimed assets and state
  - plus `safe`, `safe_txs`, `ephe_addr_info` tables
  - File: `email-wallet/packages/relayer/src/database.rs:1`

This DB stores off‑chain metadata (users, claims, etc.). On‑chain state lives in contracts and is accessed via `ethers-rs` calls.

## Step‑By‑Step Flow

### 1) Create Account Request → Invitation Email

- Route: `/api/createAccount` (POST)
  - Router: `email-wallet/packages/relayer/src/modules/web_server/server.rs:197`
  - Handler: `email-wallet/packages/relayer/src/modules/web_server/rest_api.rs:223` (`create_account_api_fn`)
    - Input: `{ email_addr }`
    - Reads existing code: `DB.get_account_code(email_addr)`
    - If none: generate `AccountCode`, compose subject `"Email Wallet Account Creation. Code <hex>"`, render `account_creation.html`, return `(account_code_hex, EmailMessage)`
    - If already exists and deployed: sends a “already created / sign in” email including derived `walletAddr`
  - Email sending is done by the router via `send_email(email)`
    - `email-wallet/packages/relayer/src/modules/mail.rs:405`

Notes:
- This step does NOT call any smart contract. It only generates an invitation.

### 2) User Reply Intake (IMAP) → Ack

- IMAP container posts raw MIME to `/api/receiveEmail` (POST)
  - Router: `email-wallet/packages/relayer/src/modules/web_server/server.rs:268`
  - Handler: `email-wallet/packages/relayer/src/modules/web_server/rest_api.rs:422` (`receive_email_api_fn`)
    - Parses email with `ParsedEmail::new_from_raw_email` and immediately sends an acknowledgement email (`EmailWalletEvent::Ack`).
    - Spawns async processing via `handle_email(email.clone())`.

### 3) Email Processing (Create Account Path)

- Entrypoint: `handle_email(email: String) -> Result<(EmailWalletEvent, bool)>`
  - File: `email-wallet/packages/relayer/src/core.rs:19`

Detailed steps:
1. Parse sender and subject
   - `ParsedEmail::new_from_raw_email(&email)`
   - `from_addr = parsed_email.get_from_addr()`
2. DKIM registry ensure/update
   - `check_and_update_dkim(&email, &parsed_email)`
     - File: `email-wallet/packages/relayer/src/core.rs:491`
     - Computes DKIM public key hash from canonicalized header; checks on‑chain via chain client:
       - `CLIENT.check_if_dkim_public_key_hash_valid(domain, public_key_hash)`
         - File: `email-wallet/packages/relayer/src/chain.rs:739`
     - If missing: fetch a signature via the DKIM Oracle (ICP canister) and set on‑chain:
       - Oracle client: `email-wallet/packages/relayer/src/modules/dkim_oracle.rs`
       - On‑chain set: `CLIENT.set_dkim_public_key_hash(selector, domain, public_key_hash, signature)`
         - File: `email-wallet/packages/relayer/src/chain.rs:363`
3. Invitation code detection
   - `parsed_email.get_invitation_code()`
   - If present, derive `AccountSalt = hash(padded(from_addr), AccountCode)` and decide account creation path.
4. Gate: account not yet created
   - Check deployed status: `CLIENT.check_if_account_created_by_account_code(from_addr, account_code_hex)`
     - File: `email-wallet/packages/relayer/src/chain.rs:722`
5. Generate ZK proof inputs and proof
   - Build circuit input: `generate_account_creation_input(&email, RELAYER_RAND)` (from `relayer_utils` crate)
   - Prover call: `(proof, pub_signals) = generate_proof(input, "account_creation", PROVER_ADDRESS)`
     - HTTP: `POST {PROVER_ADDRESS}/prove/account_creation` with `{ input }`
     - File: `email-wallet/packages/relayer/src/utils/utils.rs:124`
     - Prover Flask endpoints: `email-wallet/packages/prover/local.py:24`, implementation in `core.py:6`
6. Build on‑chain `EmailProof` and args
   - Map `pub_signals` to fields (indices as in code):
     - `dkim_public_key_hash = pub_signals[DOMAIN_FIELDS + 0]`
     - `nullifier = pub_signals[DOMAIN_FIELDS + 1]`
     - `timestamp = pub_signals[DOMAIN_FIELDS + 2]`
     - `account_salt = pub_signals[DOMAIN_FIELDS + 3]`
     - `psi_point = (pub_signals[DOMAIN_FIELDS + 4], pub_signals[DOMAIN_FIELDS + 5])`
   - File: `email-wallet/packages/relayer/src/core.rs:41`
7. On‑chain wallet deployment
   - Chain client call: `CLIENT.create_account(AccountCreationInput { account_salt, psi_point, proof: EmailProof })`
     - File: `email-wallet/packages/relayer/src/chain.rs:157`
     - Under the hood this sends a tx to `AccountHandler.createAccount` (see “Where contracts are called” below).
8. DB persistence + follow‑ups
   - If first time: `DB.insert_user(email, account_code_hex, tx_hash, is_onboarded=true, wallet_addr)`
   - Else: `DB.user_onborded(email, tx_hash)`
   - Auto‑claim any pending claims for the user
   - Emit `EmailWalletEvent::AccountCreated` → mail module sends the “Account Created” email

If no invitation code is detected, the email is processed as a normal EmailOp (send/execute/etc.)—out of scope here.

## Where Smart Contracts Are Called

All on‑chain calls originate from the relayer’s chain client in `email-wallet/packages/relayer/src/chain.rs`. Key methods and their downstream contract calls:

- `create_account(data: AccountCreationInput) -> tx_hash`
  - File: `email-wallet/packages/relayer/src/chain.rs:157`
  - Calls the generated ABI binding: `account_handler.create_account(accountSalt, psiPoint, emailProof)` and waits for confirmations.
  - Contract logic: `AccountHandler.createAccount`
    - File: `email-wallet/packages/contracts/src/handlers/AccountHandler.sol:87`
    - Verifies:
      - DKIM key validity against registry (`isDKIMPublicKeyHashValid`)
      - Email timestamp fresh
      - Nullifier unused
      - ZK proof via `IVerifier.verifyAccountCreationProof(...)`
        - Interface: `email-wallet/packages/contracts/src/interfaces/IVerifier.sol:15`
        - Impl: `email-wallet/packages/contracts/src/verifier/Verifier.sol`
    - Deploys a deterministic proxy wallet via CREATE2 and emits `AccountCreated`.

- `set_dkim_public_key_hash(selector, domain, public_key_hash, signature) -> tx_hash`
  - File: `email-wallet/packages/relayer/src/chain.rs:363`
  - Updates `ECDSAOwnedDKIMRegistry` on chain with the oracle’s signature when a domain’s key is missing.

- Read helpers (view calls):
  - `get_wallet_addr_from_salt(account_salt) -> address`
    - File: `email-wallet/packages/relayer/src/chain.rs:543`
    - Contract view: `AccountHandler.getWalletOfSalt(accountSalt)`
  - `check_if_account_created_by_account_code(email_addr, account_code_hex) -> bool`
    - File: `email-wallet/packages/relayer/src/chain.rs:722`
    - Internally derives the salt and checks `isAccountSaltDeployed`.

Where this is invoked for create‑account:
- The actual smart contract call is made inside `handle_email` after the user replies with the invitation email and after the proof is generated:
  - `email-wallet/packages/relayer/src/core.rs:66` (build args) → `CLIENT.create_account(...)` → on‑chain tx.
  - No contract is called during the initial `/api/createAccount` request; that endpoint only sends the invitation email.

## External Calls (Network)

- Prover HTTP (Relayer → Prover)
  - Endpoint: `POST {PROVER_ADDRESS}/prove/account_creation`
  - Handler: `email-wallet/packages/prover/local.py:24`
  - Proof generation pipeline: `email-wallet/packages/prover/core.py:6`

- SMTP HTTP (Relayer → SMTP)
  - `send_email`: `email-wallet/packages/relayer/src/modules/mail.rs:405`
  - Body includes HTML rendered from templates under `email-wallet/packages/relayer/eml_templates/`.

- IMAP ingestion (IMAP → Relayer)
  - External process posts raw MIME to `POST /api/receiveEmail`
  - Router: `email-wallet/packages/relayer/src/modules/web_server/server.rs:268`

## Sequence (Condensed)

1) Frontend → Relayer: `/api/createAccount { email_addr }` → invitation email
2) User replies to invitation
3) IMAP → Relayer: `/api/receiveEmail` (raw MIME)
4) Relayer:
   - Parse + DKIM registry ensure
   - Extract invitation code
   - Generate account_creation proof (Prover)
   - Call `AccountHandler.createAccount` (Chain)
   - Update DB, send “Account Created” email

## Appendix: Useful File References

- API routes: `email-wallet/packages/relayer/src/modules/web_server/server.rs:51`
- Create account API handler: `email-wallet/packages/relayer/src/modules/web_server/rest_api.rs:223`
- Receive email API handler: `email-wallet/packages/relayer/src/modules/web_server/rest_api.rs:422`
- Core email handling: `email-wallet/packages/relayer/src/core.rs:19`
- DKIM update logic: `email-wallet/packages/relayer/src/core.rs:491`
- Chain client (on‑chain calls): `email-wallet/packages/relayer/src/chain.rs:157`, `:363`, `:543`, `:722`
- Contracts: `email-wallet/packages/contracts/src/handlers/AccountHandler.sol:87`, `email-wallet/packages/contracts/src/interfaces/IVerifier.sol:15`, `email-wallet/packages/contracts/src/verifier/Verifier.sol`
- Prover endpoints: `email-wallet/packages/prover/local.py:24`, `email-wallet/packages/prover/core.py:6`

