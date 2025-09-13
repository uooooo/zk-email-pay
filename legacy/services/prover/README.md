# Prover Service (MVP)

Minimal prover HTTP service for zk-email-pay. Provides `/healthz` and a stub `/prove/email` that validates input and returns placeholder `proof/publicSignals`.

- Language: TypeScript (Node)
- Framework: Express
- Container: Docker (optional)

## Endpoints
- `GET /healthz` → `{ status, version, uptimeSec }`
- `POST /prove/email`
  - body: `{ headers, body?, claim }` (see `src/types.ts` for schema)
  - returns: `{ proof, publicSignals, vkeyHash, circuit, timings }`

## Run (dev)
```sh
cd services/prover
cp .env.example .env
pnpm i || npm i || bun install
pnpm dev || npm run dev || bun run dev
# GET http://localhost:8080/healthz
```

## Build
```sh
npm run build && npm start
```

## Docker
```sh
docker build -t zk-email-pay-prover:dev .
# docker run -p 8080:8080 --env-file .env zk-email-pay-prover:dev
```

## Notes
- This is a stub. Integrate `snarkjs` and real circuits/keys under `circuits/` and `keys/` later.
- See `docs/engineering/zk-email-pay/plans/prover.md` for the broader plan.

