[Skip to main content](https://docs.zk.email/architecture/dkim-verification#__docusaurus_skipToContent_fallback)

On this page

Discover how ZK Email uses DKIM for trustless email verification on the blockchain.

* * *

ZK Email utilizes **DKIM** ( **DomainKeys Identified Mail**) as a key component in its architecture to enable trustless email verification on blockchain networks. This document explores how ZK Email uses the power of DKIM to achieve secure, privacy-preserving email authentication in decentralized environments.

We'll explore the fundamental aspects of DKIM, its role in email security, and how ZK Email uses this protocol to create a trustless solution for blockchain-based email verification. By understanding how DKIM and ZK Email work together, we can appreciate the foundation they provide for next-generation, trustless email authentication systems.

## What is DKIM? [​](https://docs.zk.email/architecture/dkim-verification\#what-is-dkim "Direct link to What is DKIM?")

DKIM is an email authentication protocol that allows the recipient to verify that an email was indeed sent and authorized by the owner of a specific domain. It does this by attaching a digital signature, linked to a domain name, to each outgoing email. The recipient's mail server can then validate this signature using the sender's public key published in the DNS records, ensuring the email hasn't been altered in transit.

### Key Features of DKIM [​](https://docs.zk.email/architecture/dkim-verification\#key-features-of-dkim "Direct link to Key Features of DKIM")

- **Authenticity:** Confirms that the email was sent by the claimed domain.
- **Integrity:** Ensures that the email content has not been tampered with during transmission.
- **Non-repudiation:** Provides evidence that the email originated from the stated domain.

## The DKIM Signature Process [​](https://docs.zk.email/architecture/dkim-verification\#the-dkim-signature-process "Direct link to The DKIM Signature Process")

The DKIM signing process involves several steps that work together to secure an email:

1. **Canonicalization:** The email's headers and body are standardized to a consistent format. This step accounts for any minor changes that might occur during transmission, such as line ending conversions.

2. **Hashing:** A cryptographic hash (usually SHA-256) is computed over the selected headers and the email body. Common headers included are `From`, `To`, `Subject`, and `Date`. The body hash ( `bh`) is calculated separately and included in the `DKIM-Signature` header.

3. **Signing:** The hash of the headers is encrypted with the domain's private RSA key, creating the digital signature ( `b` tag). The signature and related metadata are added to the email's `DKIM-Signature` header.

4. **DNS Publication:** The domain's public key is published in its DNS records under a specific selector, allowing recipients to retrieve it for signature verification.


### Example of a DKIM-Signature Header [​](https://docs.zk.email/architecture/dkim-verification\#example-of-a-dkim-signature-header "Direct link to Example of a DKIM-Signature Header")

```codeBlockLines_e6Vv
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;
 d=example.com; s=selector1; h=from:to:subject:date;
 bh=Base64(SHA256(body)); b=Base64(RSA-Signature);

```

- `v`: DKIM version.
- `a`: Algorithm used (e.g., `rsa-sha256`).
- `c`: Canonicalization method for header and body.
- `d`: Sending domain.
- `s`: Selector for locating the public key in DNS.
- `h`: Headers included in the hash.
- `bh`: Body hash.
- `b`: Signature.

## How DKIM Verification Works [​](https://docs.zk.email/architecture/dkim-verification\#how-dkim-verification-works "Direct link to How DKIM Verification Works")

When an email arrives at the recipient's mail server, DKIM verification occurs as follows:

1. **Public Key Retrieval:**
   - The server extracts the `d` (domain) and `s` (selector) from the `DKIM-Signature` header.
   - It queries the DNS for the corresponding public key.
2. **Hash Recalculation:**
   - The server canonicalizes the email headers and body using the same method as the sender.
   - It recalculates the hash over the specified headers and body.
3. **Signature Verification:**
   - Using the public key, the server decrypts the signature from the `b` tag.
   - It compares the decrypted signature to the recalculated hash.
   - If they match, the email passes DKIM verification; otherwise, it fails.

**Outcome:**

- **Pass:** The email is considered authentic and untampered.
- **Fail:** The email may be marked as spam, rejected, or subjected to further scrutiny.

## Why is DKIM Important? [​](https://docs.zk.email/architecture/dkim-verification\#why-is-dkim-important "Direct link to Why is DKIM Important?")

DKIM plays a crucial role in email security and deliverability:

1. **Enhances Sender Reputation:**
   - Emails signed with DKIM appear more legitimate to receiving servers.
   - Over time, this builds a positive reputation for the sending domain, improving deliverability.
2. **Protects Against Spoofing:**
   - DKIM makes it significantly harder for malicious actors to send emails that appear to come from your domain.
   - It helps prevent phishing and spam campaigns that exploit domain spoofing.
3. **Integrates with Other Security Protocols:**
   - DKIM works in tandem with SPF (Sender Policy Framework) and DMARC (Domain-based Message Authentication, Reporting, and Conformance) to provide layered email security.
4. **Maintains Email Integrity:**
   - Ensures that the email content remains unchanged during transit, preserving the intended message.

## What is a DKIM Record? [​](https://docs.zk.email/architecture/dkim-verification\#what-is-a-dkim-record "Direct link to What is a DKIM Record?")

A DKIM record is a specially formatted DNS TXT record that stores the public key used by receiving mail servers to verify an email's signature. It includes:

- **Selector ( `s`):** A label that helps identify the correct public key when multiple keys are used.
- **Domain ( `d`):** The domain associated with the email.
- **Public Key ( `p`):** The RSA public key in Base64 encoding.

**Example of a DKIM DNS Record:**

```codeBlockLines_e6Vv
selector1._domainkey.example.com IN TXT "v=DKIM1; k=rsa; p=Base64(Public Key)"

```

- `selector1`: The selector specified in the `DKIM-Signature` header.
- `_domainkey`: A fixed prefix indicating a DKIM key.
- `v`: DKIM version.
- `k`: Key type (usually `rsa`).
- `p`: The public key.

## How ZK Email Uses DKIM [​](https://docs.zk.email/architecture/dkim-verification\#how-zk-email-uses-dkim "Direct link to How ZK Email Uses DKIM")

ZK Email leverages DKIM signatures to create zero-knowledge proofs about email contents without exposing sensitive information. The integration works as follows:

1. **Signature Verification in ZK Circuit:**
   - The zero-knowledge (ZK) circuit verifies the DKIM signature within the proof.
   - This ensures the email is authentic and unaltered without revealing the email's content.
2. **Email Structure Validation:**
   - The ZK circuit confirms that the email follows the correct structure of a DKIM-signed message.
   - It uses pattern matching (e.g., regular expressions) to validate headers and signature formats.
3. **Selective Content Proof:**
   - Specific email properties (e.g., sender domain, subject line, verification codes) can be proven without disclosing the entire email.
   - Users can demonstrate possession of certain information while keeping other parts private.
4. **On-chain Verification:**
   - The ZK proof is submitted to a smart contract on the blockchain.
   - The contract verifies the proof using the sender's public key from an on-chain registry.
   - Successful verification enables trustless interactions based on the email's validated properties.

## Advantages of DKIM for ZK Email [​](https://docs.zk.email/architecture/dkim-verification\#advantages-of-dkim-for-zk-email "Direct link to Advantages of DKIM for ZK Email")

1. **Widespread Adoption:**
   - **Reliability:** Most modern email services implement DKIM, making it a stable foundation.
   - **Compatibility:** Works seamlessly with existing email infrastructure.
2. **Trustless Verification:**
   - **No Need for Intermediaries:** Eliminates reliance on third-party verifiers.
   - **Decentralized Trust:** Aligns with blockchain principles by enabling verification through cryptographic proofs.
3. **Privacy Preservation:**
   - **Zero-Knowledge Proofs:** Allows verification of email properties without revealing the actual content.
   - **Selective Disclosure:** Users have control over what information they share.
4. **Enhanced Security:**
   - **Integrity Assurance:** Confirms that the email hasn't been tampered with.
   - **Protection Against Spoofing:** Validates the sender's domain, reducing phishing risks.
5. **Flexible Applications:**
   - **Identity Verification:** Prove ownership of an email address without exposing it.
   - **Access Control:** Grant permissions based on verified email attributes.
   - **Confidential Communications:** Share proofs of sensitive information without disclosure.

## Challenges and Solutions [​](https://docs.zk.email/architecture/dkim-verification\#challenges-and-solutions "Direct link to Challenges and Solutions")

### 1\. Key Rotation [​](https://docs.zk.email/architecture/dkim-verification\#1-key-rotation "Direct link to 1. Key Rotation")

**Challenge:**

- DKIM keys are periodically rotated for security, which could invalidate existing proofs if not managed properly.

**Solution:**

- **On-chain Key Registry:**
  - ZK Email maintains an on-chain registry of DKIM public keys.
  - Keys are securely updated as rotations occur.
- **User Override Options:**
  - Users can set trusted keys or override defaults to handle key changes.
- **Security Measures:**
  - Implement safeguards to prevent unauthorized key updates.
  - Consider community governance or trusted oracles for key validation.

### 2\. DNS Trust Issues [​](https://docs.zk.email/architecture/dkim-verification\#2-dns-trust-issues "Direct link to 2. DNS Trust Issues")

**Challenge:**

- Relying on DNS for public keys introduces potential vulnerabilities, such as DNS spoofing.

**Solution:**

- **DNSSEC Integration:**
  - Utilize DNS Security Extensions to authenticate DNS responses.
  - Ensures that the retrieved DKIM public keys are legitimate.
- **Fallback Mechanisms:**
  - In cases where DNSSEC is not available, use cached keys or multiple DNS sources.
- **User-Overrideable Key Registries:**
  - Allow users to specify or confirm the DKIM keys they trust.

### 3\. Email Content Variability [​](https://docs.zk.email/architecture/dkim-verification\#3-email-content-variability "Direct link to 3. Email Content Variability")

**Challenge:**

- Email formats can vary widely between providers and over time, complicating parsing and verification.

**Solution:**

- **Robust Parsing Techniques:**
  - Implement flexible parsing in ZK circuits using advanced pattern matching.
- **Regular Updates:**
  - Continuously update parsing logic to accommodate new email formats.
- **Community Collaboration:**
  - Engage with users and developers to identify and adapt to changes in email structures.

### 4\. Computational Complexity [​](https://docs.zk.email/architecture/dkim-verification\#4-computational-complexity "Direct link to 4. Computational Complexity")

**Challenge:**

- Verifying cryptographic signatures and hashing within ZK proofs can be resource-intensive.

**Solution:**

- **Optimized Circuits:**
  - Design efficient ZK circuits tailored for RSA verification and hashing algorithms.
- **Proof Aggregation and Compression:**
  - Use recursive proofs or aggregation techniques to reduce proof sizes and verification times.
- **Flexible Proof Generation:**
  - Allow proof generation to be performed by users, ZK Email servers, or their own servers, depending on resource availability and privacy preferences.

### 5\. Limitations of DKIM [​](https://docs.zk.email/architecture/dkim-verification\#5-limitations-of-dkim "Direct link to 5. Limitations of DKIM")

**Challenge:**

- DKIM does not encrypt the email content or protect against all types of email threats, such as man-in-the-middle attacks after delivery.

**Solution:**

- **Complementary Protocols:**
  - Combine DKIM with other security measures like SPF and DMARC for comprehensive protection.
- **Encryption Standards:**
  - Encourage the use of end-to-end encryption protocols (e.g., S/MIME or PGP) for sensitive communications.
- **User Education:**
  - Inform users about the scope of DKIM and the importance of additional security practices.

## Frequently Asked Questions [​](https://docs.zk.email/architecture/dkim-verification\#frequently-asked-questions "Direct link to Frequently Asked Questions")

**What happens if a DKIM key is compromised?**

**Answer:** If a private DKIM key is compromised, an attacker could sign emails that appear legitimate. ZK Email mitigates this risk by allowing rapid key rotation and maintaining an on-chain registry that can revoke compromised keys.

**Can I use multiple DKIM selectors for the same domain?**

**Answer:** Yes, a domain can have multiple DKIM selectors, each with its own public/private key pair. This is useful for key rotation and managing different email streams.

**Does DKIM guarantee that an email is safe or not spam?**

**Answer:** DKIM verifies the authenticity and integrity of an email but does not assess its content. An email passing DKIM checks could still be spam or malicious. Combining DKIM with content filtering and user awareness is important.

**Is it necessary for recipients to support DKIM for ZK Email to work?**

**Answer:** Yes, recipients need to support DKIM verification to benefit from its security features. However, ZK Email's use of zero-knowledge proofs allows for trustless verification on the blockchain, independent of the recipient's mail server capabilities.

## Learn More [​](https://docs.zk.email/architecture/dkim-verification\#learn-more "Direct link to Learn More")

To further explore how ZK Email builds upon DKIM and integrates with blockchain technology, consider diving into the following topics:

[**📄️Zero-Knowledge Proofs** \\
Understand how ZKPs enable private verification of email content.](https://docs.zk.email/architecture/zk-proofs)[**📄️On-chain Integration** \\
Learn how ZK Email interacts with smart contracts for trustless verification.](https://docs.zk.email/architecture/on-chain)[**📄️Security Considerations** \\
Review the trust assumptions and security measures in place to safeguard the system.](https://docs.zk.email/architecture/security-considerations)

- [What is DKIM?](https://docs.zk.email/architecture/dkim-verification#what-is-dkim)
  - [Key Features of DKIM](https://docs.zk.email/architecture/dkim-verification#key-features-of-dkim)
- [The DKIM Signature Process](https://docs.zk.email/architecture/dkim-verification#the-dkim-signature-process)
  - [Example of a DKIM-Signature Header](https://docs.zk.email/architecture/dkim-verification#example-of-a-dkim-signature-header)
- [How DKIM Verification Works](https://docs.zk.email/architecture/dkim-verification#how-dkim-verification-works)
- [Why is DKIM Important?](https://docs.zk.email/architecture/dkim-verification#why-is-dkim-important)
- [What is a DKIM Record?](https://docs.zk.email/architecture/dkim-verification#what-is-a-dkim-record)
- [How ZK Email Uses DKIM](https://docs.zk.email/architecture/dkim-verification#how-zk-email-uses-dkim)
- [Advantages of DKIM for ZK Email](https://docs.zk.email/architecture/dkim-verification#advantages-of-dkim-for-zk-email)
- [Challenges and Solutions](https://docs.zk.email/architecture/dkim-verification#challenges-and-solutions)
  - [1\. Key Rotation](https://docs.zk.email/architecture/dkim-verification#1-key-rotation)
  - [2\. DNS Trust Issues](https://docs.zk.email/architecture/dkim-verification#2-dns-trust-issues)
  - [3\. Email Content Variability](https://docs.zk.email/architecture/dkim-verification#3-email-content-variability)
  - [4\. Computational Complexity](https://docs.zk.email/architecture/dkim-verification#4-computational-complexity)
  - [5\. Limitations of DKIM](https://docs.zk.email/architecture/dkim-verification#5-limitations-of-dkim)
- [Frequently Asked Questions](https://docs.zk.email/architecture/dkim-verification#frequently-asked-questions)
- [Learn More](https://docs.zk.email/architecture/dkim-verification#learn-more)