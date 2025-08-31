[Skip to main content](https://docs.zk.email/zk-email-sdk/#__docusaurus_skipToContent_fallback)

On this page

Learn how to generate and verify ZK Proofs inside your application using the Blueprint SDK.

* * *

The Blueprint SDK is a TypeScript library that lets you integrate ZK Email verification into your applications. It handles all the cryptographic complexity - you just need to know regex patterns to specify what email fields to extract (like sender, subject, content). The SDK submits your pattern definitions to the [**Registry**](https://docs.zk.email/zk-email-sdk/registry).

The **Registry** takes care of compiling the ZK circuits and deploying verification contracts. This means you can quickly add email verification without dealing with any zero-knowledge cryptography implementation details.

## Core Features [​](https://docs.zk.email/zk-email-sdk/\#core-features "Direct link to Core Features")

The Blueprint SDK consists of three main features:

**Create Blueprint** lets you define email verification templates by specifying regex patterns and fields to extract from emails, along with proof parameters like public/private data visibility.

**Generate Proof** creates zero-knowledge proofs from emails based on blueprint specifications, proving authenticity and content claims without revealing the actual email.

**Verify Proof** validates proofs both off-chain and through smart contracts on-chain, allowing dApps to trustlessly verify email-based claims.

## Documentation [​](https://docs.zk.email/zk-email-sdk/\#documentation "Direct link to Documentation")

[**📄️Setup** \\
Setup your project with the Blueprint SDK.](https://docs.zk.email/zk-email-sdk/setup)

- [Core Features](https://docs.zk.email/zk-email-sdk/#core-features)
- [Documentation](https://docs.zk.email/zk-email-sdk/#documentation)