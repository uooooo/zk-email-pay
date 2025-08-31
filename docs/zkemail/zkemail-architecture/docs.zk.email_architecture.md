[Skip to main content](https://docs.zk.email/architecture/#__docusaurus_skipToContent_fallback)

On this page

Learn how ZK Email's architecture combines email verification and zero-knowledge proofs for trustless, private validation of email contents on blockchains, utilizing existing email infrastructure.

* * *

ZK Email adds new capabilities to existing email infrastructure by using the **DKIM (DomainKeys Identified Mail)** signatures. By integrating **zero-knowledge proofs**, our ZK Email system authenticates DKIM signatures and validates specific email content properties **without exposing the entire email**, thereby ensuring both security and privacy.

This approach unlocks a wide range of applications in both Web2 and Web3 environments, from secure identity verification to confidential information sharing, all while preserving the privacy and integrity of email communications.

## Explore ZK Email Architecture [​](https://docs.zk.email/architecture/\#explore-zk-email-architecture "Direct link to Explore ZK Email Architecture")

To gain a comprehensive understanding of each component, dive into the following topics:

[**📄️DKIM Verification** \\
Learn how ZK Email uses DKIM for trustless email verification.](https://docs.zk.email/architecture/dkim-verification)[**📄️Zero-Knowledge Proofs** \\
Explore the role of zero-knowledge proofs to verify emails.](https://docs.zk.email/architecture/zk-proofs)[**📄️On-chain Integration** \\
Discover how ZK Email enables trustless blockchain verification.](https://docs.zk.email/architecture/on-chain)[**📄️Security Considerations** \\
Explore the trust assumptions and security measures in ZK Email.](https://docs.zk.email/architecture/security-considerations)

## How It Works [​](https://docs.zk.email/architecture/\#how-it-works "Direct link to How It Works")

To simplify understanding, here's a diagram illustrating the core workflow of ZK Email:

ApplicationDKIM Public Key RegistrySmart ContractUserEmail SenderApplicationDKIM Public Key RegistrySmart ContractUserEmail Sender1\. Sends DKIM-signed email2\. Extracts email partsand generates ZK Proof3\. Submits ZK Proof4\. Retrieves DKIM Public KeyReturns DKIM Public KeyVerifies ZK Proof5\. If valid, trigger actionAction taken (e.g., access granted)

1. **Email Receipt**:
   - The user receives an email from a sender that is signed using DKIM.
2. **Proof Generation**:
   - The user extracts necessary parts of the email (headers, body hash).
   - A zero-knowledge proof is generated on the client side, verifying the DKIM signature and specific email properties without revealing sensitive content.


     info





     Note: The proof generation can be performed by the user, by ZK Email servers, or by their own servers, depending on their preferences for privacy and computational resources.
3. **Proof Submission**:
   - The user submits the ZK proof to a smart contract on the blockchain.
4. **On-chain Verification**:
   - The smart contract verifies the proof using the sender's DKIM public key from the on-chain registry.
   - The proof confirms the email's authenticity and the specified properties.

This process ensures that email verification is trustless and privacy-preserving, leveraging existing email infrastructure without the need for centralized intermediaries.

- [Explore ZK Email Architecture](https://docs.zk.email/architecture/#explore-zk-email-architecture)
- [How It Works](https://docs.zk.email/architecture/#how-it-works)