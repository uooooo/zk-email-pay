# Style and Conventions

- TypeScript: strict mode, ESLint + Prettier. Avoid one-letter vars; no inline license headers.
- React: colocate components in src/components, keep state minimal.
- Env: NEXT_PUBLIC_* for public config; secrets only in server-side envs. No secrets in repo.
- Git: Conventional Commits; Issue-driven branches; squash-merge.
- Docs: Update docs/product/zk-email-pay/* when behavior/architectural changes.
- Privacy: Emails not stored in plaintext onchain; offchain hashed/masked; logs minimized.
