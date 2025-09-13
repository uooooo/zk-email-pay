# Base Sepolia Hybrid Run

Contracts on Base Sepolia; relayer/prover/DB local; Gmail IMAP/SMTP; DKIM via IC DKIM Oracle + ECDSAOwnedDKIMRegistry. Falls back with helpful errors if parsing/DKIM is missing.

References adapted for this setup:
- docs/engineering/zk-email-pay/test-dev-guide/Hybrid-Testing-Guide.md (uses Mailpit/Anvil in places)
- docs/engineering/zk-email-pay/test-dev-guide/Local-Development-Guide.md
- email-wallet/packages/contracts/README.md
- email-wallet/packages/relayer/README.md
- docs/zkemail/zkemail-emailwallet/*

Differences vs prior guides: chain = Base Sepolia (84532), Gmail for SMTP/IMAP (not Mailpit), DKIM via IC DKIM Oracle (not local bypass), relayer/prover/DB run locally.

---

## 0) Prerequisites
- Foundry (forge/cast)
- Node.js 18 (use `nvm use 18` inside `email-wallet/packages/contracts`)
- Rust toolchain (for relayer)
- Python 3 + pip (for local prover)
- Docker + Docker Compose (Postgres, Gmail SMTP/IMAP wrappers)
- Base Sepolia RPC (Alchemy/Infura/QuickNode): `https://base-sepolia.g.alchemy.com/v2/<key>`
- Gmail account with IMAP enabled and an App Password for IMAP/SMTP
- IC identity PEM for DKIM Oracle (see `docs/icp-relayer/How-to-setup-ICP-account-for-relayer.md`)

---

## 1) Deploy Contracts to Base Sepolia

Inside `email-wallet/packages/contracts`:

1) Create `.env` and set Base Sepolia
```bash
cd email-wallet/packages/contracts
cp .env.sample .env
# Edit .env
# PRIVATE_KEY=0x... (deployer EOA with Base Sepolia funds)
# RPC_URL=https://base-sepolia.g.alchemy.com/v2/<key>
# CHAIN_ID=84532
# CHAIN_NAME=base-sepolia
```

2) Build and deploy (recommended: DefaultSetup)
```bash
nvm use 18
forge build --skip test --skip script
source .env && \
forge script script/DefaultSetupScript.s.sol:Deploy \
  --rpc-url $RPC_URL \
  --chain-id $CHAIN_ID \
  --broadcast -vvv
```

3) Capture addresses from logs (you’ll need):
- EmailWalletCore proxy → `CORE_CONTRACT_ADDRESS`
- RelayerHandler proxy (for relayer registration)
- TestERC20 (or your chosen onboarding token) → `ONBOARDING_TOKEN_ADDR`
- ECDSAOwnedDKIMRegistry

4) Register the relayer in `RelayerHandler`
```bash
# still under packages/contracts
export RPC_URL=https://base-sepolia.g.alchemy.com/v2/<key>
export PRIVATE_KEY=0x...         # the relayer’s EOA (same key used in relayer .env)
export RELAYER_HANDLER=<RelayerHandler_proxy_address>
export RELAYER_EMAIL=your@gmail.com
export RELAYER_HOSTNAME=gmail.com
forge script script/RegisterRelayer.s.sol --rpc-url $RPC_URL --broadcast
```

---

## 2) Local Postgres (DB)

Use Docker or your local DB. Example (Docker):
```bash
docker run --rm --name email-wallet-db \
  -e POSTGRES_PASSWORD=emailWallet_password \
  -e POSTGRES_USER=emailWallet \
  -e POSTGRES_DB=emailWallet \
  -p 5432:5432 postgres:15
```
Relayer `DATABASE_URL` example: `postgresql://emailWallet:emailWallet_password@localhost:5432/emailWallet`

---

## 3) Local Prover (Python Flask)

```bash
cd email-wallet/packages/prover
pip install -r requirements.txt
# optional helpers:
# npm i -g snarkjs@latest
# ./local_setup.sh
python3 local.py   # listens on :8080, exposes /prove/*
```
Set `PROVER_ADDRESS=http://127.0.0.1:8080` in relayer.

---

## 4) Gmail SMTP/IMAP wrappers (Docker)

Use the repo’s wrappers to talk to Gmail and expose HTTP endpoints.

From repo root `email-wallet/`:
```bash
cat > .env <<'EOF'
# SMTP wrapper (HTTP → Gmail SMTP)
SMTP_PORT=3000
SMTP_INTERNAL_SERVER_HOST=0.0.0.0
SMTP_INTERNAL_SERVER_PORT=3000
SMTP_DOMAIN_NAME=smtp.gmail.com
SMTP_LOGIN_ID=your@gmail.com
SMTP_LOGIN_PASSWORD=<your_app_password>
SMTP_MESSAGE_ID_DOMAIN=gmail.com
SMPT_JSON_LOGGER=true
SMTP_JSON_LOGGER=true
SMTP_EMAIL_SENDER_NAME=Email Wallet

# IMAP wrapper (poll Gmail → relayer /api/receiveEmail)
IMAP_LOGIN_ID=your@gmail.com
IMAP_LOGIN_PASSWORD=<your_app_password>
IMAP_DOMAIN_NAME=imap.gmail.com
IMAP_PORT=993
IMAP_AUTH_TYPE=password
IMAP_JSON_LOGGER=true
EOF

docker compose up --build -d smtp imap
# SMTP health: http://localhost:3000/api/ping
```

You can also run `db` here if you prefer container DB: `docker compose up -d db`.

---

## 5) Relayer (local binary)

Prepare `email-wallet/packages/relayer/.env`:
```ini
CORE_CONTRACT_ADDRESS=<EmailWalletCore_proxy>
PRIVATE_KEY=0x...                              # same EOA used in RegisterRelayer
CHAIN_RPC_PROVIDER=https://base-sepolia.g.alchemy.com/v2/<key>
CHAIN_RPC_EXPLORER=https://sepolia.basescan.org
CHAIN_ID=84532

# IC DKIM Oracle
CANISTER_ID=i73e6-2qaaa-aaaan-qepxa-cai
PEM_PATH=./.ic.pem
IC_REPLICA_URL=https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=i73e6-2qaaa-aaaan-qepxa-cai
WALLET_CANISTER_ID=oot2w-gaaaa-aaaas-qbvga-cai

# Email + SMTP wrapper
SMTP_SERVER=http://127.0.0.1:3000/api/sendEmail
ERROR_EMAIL_ADDRESSES=your@gmail.com
RELAYER_EMAIL_ADDR=your@gmail.com
RELAYER_HOSTNAME=gmail.com

# Prover + DB
PROVER_ADDRESS=http://127.0.0.1:8080
DATABASE_URL=postgresql://emailWallet:emailWallet_password@localhost:5432/emailWallet

# Server + assets
FEE_PER_GAS=0
WEB_SERVER_ADDRESS=127.0.0.1:4500
CIRCUITS_DIR_PATH=../circuits
SUBGRAPH_URL=https://gateway-arbitrum.network.thegraph.com/api/<api-key>/subgraphs/id/AFNg1WfLo4dv1tfixaKCvWTVnFGEsVhVKx2Kef1dbt9G
INPUT_FILES_DIR_PATH=./input_files
EMAIL_TEMPLATES_PATH=./eml_templates/

ONBOARDING_TOKEN_ADDR=<TestERC20_or_your_token>
ONBOARDING_TOKEN_AMOUNT=100
ONBOARDING_TOKEN_DISTRIBUTION_LIMIT=10
ONBOARDING_REPLY="You received 100 TEST!"
SAFE_API_ENDPOINT=https://safe-transaction-base-sepolia.safe.global/api
```

Run relayer:
```bash
cd email-wallet/packages/relayer
cargo run --release   # API at http://127.0.0.1:4500
```

---

## 6) E2E Create Account Test

1) Request invitation
```bash
curl -sS -X POST http://127.0.0.1:4500/api/createAccount \
  -H 'Content-Type: application/json' \
  -d '{"email_addr":"your@gmail.com"}'
```
Check Gmail for `Email Wallet Account Creation. Code <hex>`.

2) Reply to that email (blank body OK).
- IMAP wrapper posts raw MIME to relayer `/api/receiveEmail`.

3) Observe relayer logs
- DKIM ensure: if domain key missing on-chain, relayer calls IC DKIM Oracle and sets hash in ECDSAOwnedDKIMRegistry.
- Prover proof `account_creation`, then on-chain `AccountHandler.createAccount`.

4) Verify on Base Sepolia explorer
- Use `CHAIN_RPC_EXPLORER` (e.g., `https://sepolia.basescan.org/tx/<hash>`).

5) Confirmation email
- Relayer sends "Your Email Wallet Account is created".

---

## 7) Troubleshooting / Bypass

- Gmail SMTP/IMAP
  - Ensure IMAP is enabled and App Passwords used.
  - SMTP wrapper ping: `http://localhost:3000/api/ping`.

- DKIM / IC Oracle
  - Ensure `PEM_PATH`, `CANISTER_ID`, `WALLET_CANISTER_ID`, `IC_REPLICA_URL` correct.
  - If relayer cannot parse email (e.g., missing DKIM header), it now sends a helpful error and skips processing (intake fallback). Gmail messages should include DKIM; view raw headers.
  - A full “local signer” DKIM bypass (skip oracle even on parse success) is not wired; would require code in `check_and_update_dkim`.

- Contracts
  - Verify `RegisterRelayer.s.sol` ran with the same EOA as `PRIVATE_KEY` in relayer.
  - Double-check all deployed addresses in `.env`.

- Prover
  - Confirm `http://127.0.0.1:8080` is reachable; test a `/prove/*` endpoint.

---

## 8) Pointers
- Contracts: `email-wallet/packages/contracts/README.md`
- Relayer: `email-wallet/packages/relayer/README.md`
- Flow internals: `docs/engineering/zk-email-pay/Email-Wallet-Create-Account-Flow.md`
- DKIM fallback behavior: `docs/engineering/zk-email-pay/DKIM/DKIM-Bypass-Create-Account-Flow.md`
