[Skip to main content](https://docs.zk.email/architecture/security-considerations#__docusaurus_skipToContent_fallback)

On this page

Explore ZK Email's security measures for safe, private blockchain email verification.

* * *

ZK Email's architecture is designed with security as a top priority. This document outlines the key security considerations, trust assumptions, and measures implemented in ZK Email to ensure a robust and trustworthy system for email verification on the blockchain.

## Trust Assumptions [​](https://docs.zk.email/architecture/security-considerations\#trust-assumptions "Direct link to Trust Assumptions")

While ZK Email significantly reduces trust requirements compared to traditional systems, it still relies on certain assumptions:

1. **DKIM Implementation**: We assume that email providers correctly implement DKIM signing and that their private keys remain secure.

2. **DNS Security**: The current system relies on DNS for fetching DKIM public keys, which introduces some trust in the DNS infrastructure.

3. **Cryptographic Assumptions**: The security of ZK Email depends on the underlying cryptographic primitives used in zero-knowledge proofs and DKIM signatures.


## Key Security Measures [​](https://docs.zk.email/architecture/security-considerations\#key-security-measures "Direct link to Key Security Measures")

### 1\. Zero-Knowledge Proofs [​](https://docs.zk.email/architecture/security-considerations\#1-zero-knowledge-proofs "Direct link to 1. Zero-Knowledge Proofs")

- **Privacy Protection**: ZKPs allow verification of email properties without revealing the full content, protecting user privacy.
- **Selective Disclosure**: Users can choose which parts of an email to prove, minimizing unnecessary data exposure.

### 2\. On-chain DKIM Public Key Registry [​](https://docs.zk.email/architecture/security-considerations\#2-on-chain-dkim-public-key-registry "Direct link to 2. On-chain DKIM Public Key Registry")

- **Trustless Verification**: By maintaining an on-chain registry of DKIM public keys, ZK Email reduces reliance on potentially manipulable DNS lookups.
- **Key Rotation Handling**: The system includes mechanisms to securely update DKIM public keys, addressing the challenge of key rotation.

#### Trust Properties and Security Measures [​](https://docs.zk.email/architecture/security-considerations\#trust-properties-and-security-measures "Direct link to Trust Properties and Security Measures")

> The following section details our approach to DKIM key management and security, as explained by our team in this [Twitter thread](https://x.com/yush_g/status/1895551051031605563?t=42pPxsTbAcZuh7KkW0KarQ&s=19) discussing our partnership with Clave for ZK Email Recovery.

Since DNS values cannot be directly accessed on L1 or centralized sequencer L2s, the system implements a robust security model with multiple layers of protection:

1. **Consensus Mechanism**:
   - Uses mini consensus over 30 computers to create a threshold ECDSA signature on top of a rotated key
   - Each computer uses multiple DNS sources for redundancy
2. **User Protection Measures**:
   - Users must sign their own key rotations for any recovery settings changed in the first 48 hours
   - After 48 hours, the value can be set by the consensus alone
   - This design ensures attacks can be detected and frozen before users are affected, while maintaining smooth user experience
3. **Guardian Recovery Process**:
   - Guardians must wait 48 hours after their key rotation to trigger recovery
   - Using different email domains as guardians is encouraged to prevent simultaneous guardian affects
   - All recovery processes include a mandatory time lock during which the owner can revert changes
4. **Ongoing Improvements**:
   - Active development to enhance DNS key oracles
   - Plans to add redundant oracles like TLS Notary and DNSSEC where possible
   - Current implementation focuses on giving users and guardians ample time to recover from potential attacks

The implementation details can be found in:

- User Overrideable DKIM Registry: [GitHub Repository](https://github.com/zkemail/zk-email-verify/blob/main/packages/contracts/UserOverrideableDKIMRegistry.sol)
- Audited Oracle Code: [GitHub Repository](https://github.com/zkemail/ic-dns-oracle/blob/main/src/ic_dns_oracle_backend/src/lib.rs)

### 3\. Signature Verification [​](https://docs.zk.email/architecture/security-considerations\#3-signature-verification "Direct link to 3. Signature Verification")

- **Robust Checking**: The ZK circuits perform thorough checks on DKIM signatures, ensuring their validity and integrity.
- **Timestamp Verification**: The system verifies email timestamps to prevent the use of outdated or future-dated emails.

### 4\. Smart Contract Security [​](https://docs.zk.email/architecture/security-considerations\#4-smart-contract-security "Direct link to 4. Smart Contract Security")

- **Audited Contracts**: All smart contracts used in ZK Email undergo rigorous security audits.
- **Upgrade Mechanisms**: Carefully designed upgrade paths allow for security improvements while maintaining system integrity.

## Potential Attack Vectors and Mitigations [​](https://docs.zk.email/architecture/security-considerations\#potential-attack-vectors-and-mitigations "Direct link to Potential Attack Vectors and Mitigations")

### 1\. DNS Spoofing [​](https://docs.zk.email/architecture/security-considerations\#1-dns-spoofing "Direct link to 1. DNS Spoofing")

- **Risk**: An attacker could potentially manipulate DNS responses to provide false DKIM public keys.
- **Mitigation**: The on-chain DKIM public key registry reduces reliance on real-time DNS lookups. Future implementations may incorporate DNSSEC for additional security.

### 2\. Compromised Email Accounts [​](https://docs.zk.email/architecture/security-considerations\#2-compromised-email-accounts "Direct link to 2. Compromised Email Accounts")

- **Risk**: If an attacker gains access to a user's email account, they could potentially generate proofs for that account.
- **Mitigation**: ZK Email doesn't increase the risk beyond what already exists with compromised email accounts. Users are encouraged to maintain strong email security practices.

### 3\. Replay Attacks [​](https://docs.zk.email/architecture/security-considerations\#3-replay-attacks "Direct link to 3. Replay Attacks")

- **Risk**: An attacker might try to reuse a valid proof for multiple verifications.
- **Mitigation**: Proofs can be designed to include unique challenge data or timestamps, preventing reuse across different contexts or time periods.

### 4\. Front-running [​](https://docs.zk.email/architecture/security-considerations\#4-front-running "Direct link to 4. Front-running")

- **Risk**: In blockchain contexts, there's a potential for front-running attacks where an attacker observes a proof submission and tries to use it for their benefit.
- **Mitigation**: Application-specific smart contracts should be designed with this risk in mind, potentially incorporating commit-reveal schemes or other anti-front-running measures.

## Ongoing Security Efforts [​](https://docs.zk.email/architecture/security-considerations\#ongoing-security-efforts "Direct link to Ongoing Security Efforts")

1. **Regular Audits**: The ZK Email system undergoes regular security audits by third-party experts.

2. **Open Source**: The core components of ZK Email are open source, allowing for community review and contribution.

3. **Bounty Programs**: Bug bounty programs incentivize the discovery and responsible disclosure of potential vulnerabilities.

4. **Continuous Improvement**: The ZK Email team actively researches and implements new security measures as the cryptographic landscape evolves.


## Conclusion [​](https://docs.zk.email/architecture/security-considerations\#conclusion "Direct link to Conclusion")

While ZK Email significantly enhances the security and privacy of email-based blockchain interactions, users and developers should be aware of the underlying trust assumptions and potential risks. By understanding these security considerations, the community can make informed decisions and contribute to the ongoing improvement of the ZK Email ecosystem.

- [Trust Assumptions](https://docs.zk.email/architecture/security-considerations#trust-assumptions)
- [Key Security Measures](https://docs.zk.email/architecture/security-considerations#key-security-measures)
  - [1\. Zero-Knowledge Proofs](https://docs.zk.email/architecture/security-considerations#1-zero-knowledge-proofs)
  - [2\. On-chain DKIM Public Key Registry](https://docs.zk.email/architecture/security-considerations#2-on-chain-dkim-public-key-registry)
  - [3\. Signature Verification](https://docs.zk.email/architecture/security-considerations#3-signature-verification)
  - [4\. Smart Contract Security](https://docs.zk.email/architecture/security-considerations#4-smart-contract-security)
- [Potential Attack Vectors and Mitigations](https://docs.zk.email/architecture/security-considerations#potential-attack-vectors-and-mitigations)
  - [1\. DNS Spoofing](https://docs.zk.email/architecture/security-considerations#1-dns-spoofing)
  - [2\. Compromised Email Accounts](https://docs.zk.email/architecture/security-considerations#2-compromised-email-accounts)
  - [3\. Replay Attacks](https://docs.zk.email/architecture/security-considerations#3-replay-attacks)
  - [4\. Front-running](https://docs.zk.email/architecture/security-considerations#4-front-running)
- [Ongoing Security Efforts](https://docs.zk.email/architecture/security-considerations#ongoing-security-efforts)
- [Conclusion](https://docs.zk.email/architecture/security-considerations#conclusion)