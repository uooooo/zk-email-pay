Guides

Testing with OnchainTestKit

[Get Started](https://docs.base.org/get-started/base) [Base Chain](https://docs.base.org/base-chain/quickstart/why-base) [Base Account](https://docs.base.org/base-account/overview/what-is-base-account) [Base App](https://docs.base.org/base-app/introduction/beta-faq) [Mini Apps](https://docs.base.org/mini-apps/overview) [OnchainKit](https://docs.base.org/onchainkit/getting-started) [Cookbook](https://docs.base.org/cookbook/onboard-any-user) [Showcase](https://docs.base.org/showcase) [Learn](https://docs.base.org/learn/welcome)

On this page

- [What is OnchainTestKit?](https://docs.base.org/onchainkit/guides/testing-with-onchaintestkit#what-is-onchaintestkit%3F)
- [Why Use OnchainTestKit?](https://docs.base.org/onchainkit/guides/testing-with-onchaintestkit#why-use-onchaintestkit%3F)
- [Want to learn more?](https://docs.base.org/onchainkit/guides/testing-with-onchaintestkit#want-to-learn-more%3F)
- [Architecture](https://docs.base.org/onchainkit/guides/testing-with-onchaintestkit#architecture)
- [Key Features](https://docs.base.org/onchainkit/guides/testing-with-onchaintestkit#key-features)
- [Next Steps](https://docs.base.org/onchainkit/guides/testing-with-onchaintestkit#next-steps)

Building reliable onchain applications requires comprehensive testing. OnchainTestKit is a type-safe framework designed specifically for testing blockchain applications built with OnchainKit, providing seamless integration with Playwright for browser automation and wallet interactions.

## [​](https://docs.base.org/onchainkit/guides/testing-with-onchaintestkit\#what-is-onchaintestkit%3F)  What is OnchainTestKit?

[OnchainTestKit](https://github.com/coinbase/onchaintestkit) is an end-to-end testing framework that automates:

- Wallet connections (MetaMask, Coinbase Wallet)
- Transaction flows and approvals
- Network switching
- Smart contract interactions
- Token swaps and minting
- Gas sponsorship testing

## [​](https://docs.base.org/onchainkit/guides/testing-with-onchaintestkit\#why-use-onchaintestkit%3F)  Why Use OnchainTestKit?

Testing blockchain applications manually is time-consuming and error-prone. OnchainTestKit provides:

- **Type Safety**: Full TypeScript support with compile-time error checking
- **Wallet Automation**: Programmatic control over wallet interactions
- **Parallel Testing**: Run multiple tests simultaneously with isolated environments
- **Network Management**: Built-in support for local Anvil nodes and fork testing
- **OnchainKit Integration**: Designed to work seamlessly with OnchainKit components

## [​](https://docs.base.org/onchainkit/guides/testing-with-onchaintestkit\#want-to-learn-more%3F)  Want to learn more?

Check out [the full documentation](https://onchaintestkit.xyz/) for detailed guides on installation, configuration, and writing tests!

## [​](https://docs.base.org/onchainkit/guides/testing-with-onchaintestkit\#architecture)  Architecture

Blockchain

Test Runner

manages

manages

interacts

configures

automates

Playwright Test

Onchain Test Kit

LocalNodeManager

(Anvil Node)

Wallet Extension

(MetaMask/Coinbase/Etc...)

Test Environment

uses

uses

uses

manages

deploys contracts

deploys proxy

Playwright Test

LocalNodeManager

SmartContractManager

ProxyDeployer

Anvil Node

## [​](https://docs.base.org/onchainkit/guides/testing-with-onchaintestkit\#key-features)  Key Features

Playwright Integration

Automate browser-based wallet and dApp interactions with the power of Playwright’s testing framework.

Multi-Wallet Support

Built-in support for MetaMask and Coinbase Wallet, with an extensible architecture for adding more wallets.

Smart Action Handling

Automate connect, transaction, signature, approval, and network switching flows with simple APIs.

Network Management

Use local Anvil nodes or remote RPC endpoints, with dynamic port allocation for parallel test execution.

Type Safety

Full TypeScript support for all configuration and test APIs, catching errors at compile time.

Fluent Configuration

Builder pattern for intuitive wallet and node setup, making configuration readable and maintainable.

## [​](https://docs.base.org/onchainkit/guides/testing-with-onchaintestkit\#next-steps)  Next Steps

- Install OnchainTestKit: `yarn add -D @coinbase/onchaintestkit`
- Check out the [OnchainTestKit repository](https://github.com/coinbase/onchaintestkit)
- See [example tests](https://github.com/coinbase/onchaintestkit/tree/master/example/frontend/e2e)
- Read the [Cookbook examples](https://docs.base.org/cookbook/testing-onchain-apps) for more test scenarios
- Access the [full docs here](https://onchaintestkit.xyz/)

Was this page helpful?

YesNo

[Suggest edits](https://github.com/base/docs/edit/master/docs/onchainkit/guides/testing-with-onchaintestkit.mdx) [Raise issue](https://github.com/base/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/onchainkit/guides/testing-with-onchaintestkit)

[AI Prompting Guide](https://docs.base.org/onchainkit/guides/ai-prompting-guide) [Onchain NFT App](https://docs.base.org/onchainkit/templates/onchain-nft-app)

Assistant

Responses are generated using AI and may contain mistakes.