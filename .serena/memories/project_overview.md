# Project Overview

- Name: zk-email-pay
- Purpose: Email-address based crypto payments using zk-email + Email Wallet. Persona1 (sender with wallet) sends to an email address; Persona2 (no wallet) claims via email-only UX. Gasless via relayer.
- Scope: PoC on Base Sepolia with USDC. Minimal custom work, reuse Email Wallet architecture.
- Key Docs: docs/product/zk-email-pay/*, docs/zkemail/*, AGENT.md.
- Key Paths: frontend/, contracts/, services/relayer/, services/prover/, docs/, task/.
