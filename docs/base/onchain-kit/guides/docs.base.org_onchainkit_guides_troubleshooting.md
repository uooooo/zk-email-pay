Introduction

Troubleshooting

[Get Started](https://docs.base.org/get-started/base) [Base Chain](https://docs.base.org/base-chain/quickstart/why-base) [Base Account](https://docs.base.org/base-account/overview/what-is-base-account) [Base App](https://docs.base.org/base-app/introduction/beta-faq) [Mini Apps](https://docs.base.org/mini-apps/overview) [OnchainKit](https://docs.base.org/onchainkit/getting-started) [Cookbook](https://docs.base.org/cookbook/onboard-any-user) [Showcase](https://docs.base.org/showcase) [Learn](https://docs.base.org/learn/welcome)

On this page

- [Common Issues](https://docs.base.org/onchainkit/guides/troubleshooting#common-issues)
- [Environment Setup](https://docs.base.org/onchainkit/guides/troubleshooting#environment-setup)
- [Dependencies](https://docs.base.org/onchainkit/guides/troubleshooting#dependencies)
- [Provider Configuration](https://docs.base.org/onchainkit/guides/troubleshooting#provider-configuration)
- [Wallet Connection](https://docs.base.org/onchainkit/guides/troubleshooting#wallet-connection)
- [Transaction Issues](https://docs.base.org/onchainkit/guides/troubleshooting#transaction-issues)
- [Identity Components](https://docs.base.org/onchainkit/guides/troubleshooting#identity-components)
- [Theme Issues](https://docs.base.org/onchainkit/guides/troubleshooting#theme-issues)
- [React Native](https://docs.base.org/onchainkit/guides/troubleshooting#react-native)
- [Module Resolution](https://docs.base.org/onchainkit/guides/troubleshooting#module-resolution)
- [Getting Help](https://docs.base.org/onchainkit/guides/troubleshooting#getting-help)

This guide covers common issues you may encounter while using OnchainKit. If you don’t find your issue here, try searching our [GitHub Issues](https://github.com/coinbase/onchainkit/issues) or joining our [Discord Community](https://discord.gg/invite/buildonbase).

## [​](https://docs.base.org/onchainkit/guides/troubleshooting\#common-issues)  Common Issues

### [​](https://docs.base.org/onchainkit/guides/troubleshooting\#environment-setup)  Environment Setup

- **Missing API Key**

  - Error: “Project ID is required for this component”
  - Solution: Add your Client API Key to `.env`:

Copy

Ask AI

```
NEXT_PUBLIC_CDP_API_KEY=YOUR_PUBLIC_API_KEY

```

- **Invalid Environment Variables**  - Error: “Cannot find environment variable”
  - Solution: Use the correct variable name for your framework:
    - Next.js: `NEXT_PUBLIC_CDP_API_KEY`
    - Vite: `VITE_PUBLIC_ONCHAINKIT_API_KEY`
    - Astro: `PUBLIC_ONCHAINKIT_API_KEY`
- **Contracts Not Available**  - Error: “Contracts are not available” or “Contracts not available for LifecycleStatus”
  - Solutions:
    - Verify `NEXT_PUBLIC_ONCHAINKIT_API_KEY` is set correctly
    - For Checkout component with `chargeHandler`, also set:







      Copy







      Ask AI











      ```
      NEXT_PUBLIC_COINBASE_COMMERCE_API_KEY=YOUR_COMMERCE_API_KEY

      ```

    - Ensure API keys are properly exposed in your environment

### [​](https://docs.base.org/onchainkit/guides/troubleshooting\#dependencies)  Dependencies

- **Version Compatibility**
  - Issue: Unexpected behavior or type errors
  - Solution: Ensure compatible versions:







    Copy







    Ask AI











    ```
    {
      "dependencies": {
        "@coinbase/onchainkit": "latest",
        "viem": "^2.0.0",
        "@wagmi/core": "^2.0.0"
      }
    }

    ```

### [​](https://docs.base.org/onchainkit/guides/troubleshooting\#provider-configuration)  Provider Configuration

- **Missing OnchainKitProvider**

  - Error: “OnchainKit context not found”
  - Solution: Wrap your app with OnchainKitProvider and [configure](https://docs.base.org/onchainkit/getting-started) properly:

Copy

Ask AI

```
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { base } from 'viem/chains';

export default function App({ children }) {
  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_CDP_API_KEY}
      chain={base}
    >
      {children}
    </OnchainKitProvider>
  );
}

```

### [​](https://docs.base.org/onchainkit/guides/troubleshooting\#wallet-connection)  Wallet Connection

- **Connection Failed**  - Error: “Unable to connect wallet”
  - Solutions:
    - Verify wallet extension is installed and unlocked
    - Check [supported chains configuration](https://docs.base.org/onchainkit/wallet/wallet)
    - Ensure proper network selection in wallet
    - Verify RPC endpoints are accessible
- **Chain Switching Issues**  - Error: “Failed to switch chain”
  - Solutions:
    - Verify chain ID is supported by OnchainKit
    - Check wallet has required permissions
    - Ensure RPC endpoints are configured correctly
    - Add chain to wallet if not already added

### [​](https://docs.base.org/onchainkit/guides/troubleshooting\#transaction-issues)  Transaction Issues

- **Gas Estimation Failed**
  - Error: “Gas estimation failed”
  - Solutions:
    - Verify sufficient balance for gas
    - Check transaction parameters are valid
    - Ensure proper network [configuration](https://docs.base.org/onchainkit/transaction/transaction)

### [​](https://docs.base.org/onchainkit/guides/troubleshooting\#identity-components)  Identity Components

### [​](https://docs.base.org/onchainkit/guides/troubleshooting\#theme-issues)  Theme Issues

- **Dark Mode Not Working**

  - Error: “Dark mode styles not applying”
  - Solution: Configure Tailwind and OnchainKit properly:

Copy

Ask AI

```
// tailwind.config.js
module.exports = {
  darkMode: ['class'],
  safelist: ['dark'],
  // ... rest of config
}

```

### [​](https://docs.base.org/onchainkit/guides/troubleshooting\#react-native)  React Native

- \\*\\* React Native Support \*\*
  - OnchainKit’s components are not supported for use in React Native, however, you can use utility functions, like `getName`, as well as some hooks in your React Native app. When using these utility functions, you may need to import them directly rather than through the export file.
  - Example: `import { getName } from '@coinbase/onchainkit/esm/identity/utils/getName.js';` rather than `import { getName } from '@coinbase/onchainkit/identity;`

### [​](https://docs.base.org/onchainkit/guides/troubleshooting\#module-resolution)  Module Resolution

- **Module Resolution Errors**
  - Error: “Cannot find module … or its corresponding type declarations. Consider updating to ‘node16’, ‘nodenext’, or ‘bundler’”
  - Solution: Update your Node.js version or use a compatible bundler. We recommend using Node 18+ and `"moduleResolution": "NodeNext"` for the best developer experience. OnchainKit supports only ES Modules and does not support CommonJS modules.

## [​](https://docs.base.org/onchainkit/guides/troubleshooting\#getting-help)  Getting Help

Need more help?

- [Discord Community](https://discord.gg/invite/buildonbase)
- [X/Twitter Support](https://x.com/onchainkit)
- [GitHub Issues](https://github.com/coinbase/onchainkit/issues)

Was this page helpful?

YesNo

[Suggest edits](https://github.com/base/docs/edit/master/docs/onchainkit/guides/troubleshooting.mdx) [Raise issue](https://github.com/base/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/onchainkit/guides/troubleshooting)

[Telemetry](https://docs.base.org/onchainkit/guides/telemetry) [Next.js Installation](https://docs.base.org/onchainkit/installation/nextjs)

Assistant

Responses are generated using AI and may contain mistakes.