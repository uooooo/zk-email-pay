# Suggested Commands

# Frontend
bun install
bun run dev
bun run build
bun run lint

# Contracts (Foundry)
forge build
forge test
forge script script/Deploy.s.sol:Deploy --rpc-url $RPC_URL --broadcast -vvv

# Relayer / Prover
# (adjust to actual service entrypoints)
python services/prover/local.py
bun --cwd services/relayer run dev

# Database
docker run --rm --name email-wallet-db -e POSTGRES_PASSWORD=p@ssw0rd -e POSTGRES_USER=emailwallet -e POSTGRES_DB=emailwallet -p 5432:5432 postgres

# Git
git switch -c feat/123-scope
git add -A && git commit -m "feat(scope): ... (#123)"
git push -u origin feat/123-scope
