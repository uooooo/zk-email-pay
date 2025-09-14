# Relayer DKIM Local-Sign Bypass (Demo Mode)

This note documents the small relayer changes that enable bypassing the IC DKIM Oracle for demo/testing. It locally signs the DKIM Registry update so that on-chain checks still pass, while avoiding IC dependencies.

## What Changed

- File: `email-wallet/packages/relayer/src/core.rs`
  - Added an optional path guarded by env `DKIM_BYPASS_LOCAL_SIGN`.
  - When enabled, the relayer:
    1. Parses the email to get `selector` and `domain` (from DKIM-Signature header) and computes `public_key_hash` from the parsed public key.
    2. Builds the exact message expected by `ECDSAOwnedDKIMRegistry`:
       - `SET:selector=<s>;domain=<d>;public_key_hash=0x<bytes32>;`
    3. Signs it using `DKIM_LOCAL_SIGNER_PK` (or falls back to `PRIVATE_KEY`), and calls `setDKIMPublicKeyHash` directly.
  - This mirrors what the IC DKIM Oracle would produce, but without remote calls.

- File: `email-wallet/packages/relayer/src/modules/web_server/rest_api.rs`
  - Added a light subject pre-filter in `receive_email_api_fn` to ignore unrelated emails (reduces noisy panics during demos).

## Enabling the Bypass

Set these envs in `email-wallet/packages/relayer/.env`:

```
DKIM_BYPASS_LOCAL_SIGN=true
DKIM_LOCAL_SIGNER_PK=0x<private-key>   # optional; defaults to PRIVATE_KEY
```

Important: The deployed `ECDSAOwnedDKIMRegistry.signer()` must be the address corresponding to the private key above (i.e., you redeployed contracts with `SIGNER=<your relayer EOA>`). Otherwise the registry will revert with `Invalid signature`.

## What This Bypass Does Not Change

- ZK proof generation still needs the real `DKIM-Signature` header from the email reply. The relayer parses the raw email and constructs circuit inputs. If headers are stripped by the IMAP bridge, parsing can fail (e.g., `NoKeyForSignature`) before the on-chain `createAccount` step.
- Contract-side DKIM checks still run and pass because we updated the registry on-chain to the expected public key hash.

## Security & Scope

- Intended for demos/hackathons on testnets.
- Skips IC DKIM Oracle signature, replacing it with a local EOA signature. Use only when you also control the `ECDSAOwnedDKIMRegistry.signer` on the deployed contracts.
- For production, disable the bypass and use the IC DKIM Oracle flow end-to-end.

