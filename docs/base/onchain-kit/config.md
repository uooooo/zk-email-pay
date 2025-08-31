# <OnchainKitProvider />

Provides the OnchainKit React Context to the app.

## Usage

```tsx app.tsx
// @noErrors: 2304 - Cannot find name 'MyComponent'
import { base } from 'viem/chains';
import { OnchainKitProvider } from '@coinbase/onchainkit';

const App = () => {
  return (
    <OnchainKitProvider
      config={{
        appearance: {
          name: 'OnchainKit Playground',
          logo: 'https://onchainkit.xyz/favicon/48x48.png?v4-19-24',
          mode: 'auto',
          theme: 'default',
        },
      }}
      chain={base}
    >
      <MyComponent />
    </OnchainKitProvider>
  );
};
```

## Props

[`OnchainKitProviderReact`](/onchainkit/config/types#onchainkitproviderreact)

| Prop                       | Description                                                                                                                                                                                    | Required |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| [`chain`](#chain)          | The chain that your OnchainKit project supports.                                                                                                                                               | Yes      |
| [`apiKey`](#apikey)        | Client API Key from Coinbase Developer Platform.                                                                                                                                               | No       |
| [`rpcUrl`](#rpc-url)       | RPC URL for onchain requests.                                                                                                                                                                  | No       |
| [`projectId`](#project-id) | Your Coinbase Developer Platform Project ID.                                                                                                                                                   | No       |
| [`config`](#config)        | - `config.appearance` — Customize your OnchainKit project's appearance <br /> - `config.paymaster` — Paymaster URL for gas sponsorship <br /> - `config.wallet` — Wallet configuration options | No       |
| [`schemaId`](#schema-id)   | *\[Deprecation Pending]* The schema ID for attestations from the Ethereum Attestation Service (EAS).                                                                                           | No       |
| [`address`](#address)      | *\[Deprecation Pending]* This prop is no longer used.                                                                                                                                          | No       |

### Chain

`chain` specifies the chain on which your OnchainKit project will operate.

This prop is required for all OnchainKit components.

We recommend importing chain data from [viem](https://viem.sh/docs/chains/introduction).

### `apiKey`

`apiKey` is your Coinbase Developer Platform Client API Key.

This prop is required for most OnchainKit components, including:

* [`<Checkout>`](/onchainkit/checkout/checkout)
* [`<NFTCard>`](/onchainkit/mint/nft-card)
* [`<NFTMintCard>`](/onchainkit/mint/nft-mint-card)
* [`<Swap>`](/onchainkit/swap/swap)
* [`<Transaction>`](/onchainkit/transaction/transaction)

You can get a [Client API Key](https://portal.cdp.coinbase.com/projects/project-id/api-keys/client-key)
from Coinbase Developer Platform.

<Frame>
  <img alt="OnchainKit copy Client API Key" src="https://mintcdn.com/base-a060aa97/images/onchainkit/copy-api-key-guide.png?maxW=3484&auto=format&n=Du4siypi4SZNnQsO&q=85&s=0855dc6995d5355dd49ab43da614df1e" height="364" width="3484" height="1050" data-path="images/onchainkit/copy-api-key-guide.png" srcset="https://mintcdn.com/base-a060aa97/images/onchainkit/copy-api-key-guide.png?w=280&maxW=3484&auto=format&n=Du4siypi4SZNnQsO&q=85&s=39a66c0b02320d490da3f81f9bf23c71 280w, https://mintcdn.com/base-a060aa97/images/onchainkit/copy-api-key-guide.png?w=560&maxW=3484&auto=format&n=Du4siypi4SZNnQsO&q=85&s=6adfaccce02319bae55d3a08d7e4136f 560w, https://mintcdn.com/base-a060aa97/images/onchainkit/copy-api-key-guide.png?w=840&maxW=3484&auto=format&n=Du4siypi4SZNnQsO&q=85&s=0ea03ec195831bc41e0041121722f893 840w, https://mintcdn.com/base-a060aa97/images/onchainkit/copy-api-key-guide.png?w=1100&maxW=3484&auto=format&n=Du4siypi4SZNnQsO&q=85&s=aeec9a29ed8aa8346477985c02be2a8a 1100w, https://mintcdn.com/base-a060aa97/images/onchainkit/copy-api-key-guide.png?w=1650&maxW=3484&auto=format&n=Du4siypi4SZNnQsO&q=85&s=3ece38bbaac2349fc41e2962ba4ca73a 1650w, https://mintcdn.com/base-a060aa97/images/onchainkit/copy-api-key-guide.png?w=2500&maxW=3484&auto=format&n=Du4siypi4SZNnQsO&q=85&s=938f12ad1465c49f2e4a8dbdf25bb835 2500w" data-optimize="true" data-opv="2" />
</Frame>

### RPC URL

`rpcUrl` is required for any onchain requests. If you provide your own RPC URL,
OnchainKit will use it.

If you do not provide your own RPC URL, you must provide an `apiKey`, which
enables OnchainKit to use the
[Coinbase Developer Platform Node](https://portal.cdp.coinbase.com/products/node).

### Project ID

`projectId` is your Coinbase Developer Platform Project ID.

This prop is required for the `<FundButton />` component.

You can obtain a Project ID from the [Coinbase Developer Platform](https://portal.cdp.coinbase.com/projects).

<Frame>
  <img alt="OnchainKit copy Project ID" src="https://mintcdn.com/base-a060aa97/images/onchainkit/copy-project-id.png?maxW=1247&auto=format&n=Du4siypi4SZNnQsO&q=85&s=03e025ca8e984e0d709d023f2cd370e5" height="364" width="1247" height="466" data-path="images/onchainkit/copy-project-id.png" srcset="https://mintcdn.com/base-a060aa97/images/onchainkit/copy-project-id.png?w=280&maxW=1247&auto=format&n=Du4siypi4SZNnQsO&q=85&s=f856f7113d6af745a4c021a0dbe45eb1 280w, https://mintcdn.com/base-a060aa97/images/onchainkit/copy-project-id.png?w=560&maxW=1247&auto=format&n=Du4siypi4SZNnQsO&q=85&s=7a049845edbbc04c76fc8d95b41b59e9 560w, https://mintcdn.com/base-a060aa97/images/onchainkit/copy-project-id.png?w=840&maxW=1247&auto=format&n=Du4siypi4SZNnQsO&q=85&s=5c2b50cb77eccaeb57c00ebd920b84d6 840w, https://mintcdn.com/base-a060aa97/images/onchainkit/copy-project-id.png?w=1100&maxW=1247&auto=format&n=Du4siypi4SZNnQsO&q=85&s=f66510287d5063c33ac118a76ac45c50 1100w, https://mintcdn.com/base-a060aa97/images/onchainkit/copy-project-id.png?w=1650&maxW=1247&auto=format&n=Du4siypi4SZNnQsO&q=85&s=c0df0664dbd24714736b3342616be841 1650w, https://mintcdn.com/base-a060aa97/images/onchainkit/copy-project-id.png?w=2500&maxW=1247&auto=format&n=Du4siypi4SZNnQsO&q=85&s=cd7801defdb2fb48183f668eae4de6fe 2500w" data-optimize="true" data-opv="2" />
</Frame>

### Config

`config` is an object that can be used to customize the appearance and behavior
of the OnchainKit components.

This prop has three keys: `appearance`, `paymaster`, and `wallet`.

#### Appearance

`appearance` manages the appearance of the OnchainKit components and has the following properties:

* `name` — The name of your OnchainKit project
* `logo` — The URL of the logo for your OnchainKit project
* `mode` — The mode of the OnchainKit components. Can be `auto`, `dark`, or `light`.
* `theme` — The theme of the OnchainKit components. Can be `base`, `cyberpunk`, `default`, `hacker`, or a custom theme.

Explore appearance options in the [OnchainKit Playground](https://onchainkit.xyz/playground).

#### Paymaster

`paymaster` represents the Paymaster URL that enables you to sponsor gas for your users.

You can configure your Paymaster and obtain your Paymaster URL from the
[Coinbase Developer Platform](https://portal.cdp.coinbase.com/products/bundler-and-paymaster).

#### Wallet

`wallet` configures the wallet connection experience and has the following properties:

* `display` — The display mode for the wallet interface. Can be either:
  * `'modal'` — Shows wallet connection in a modal overlay with wallet aggregation
  * `'classic'` — Shows wallet connection in the traditional inline style
* `termsUrl` — URL to your terms of service
* `privacyUrl` — URL to your privacy policy

### Address *\[Deprecation Pending]*

`address` is no longer used and will be removed in a future version of
OnchainKit.

### Schema ID *\[Deprecation Pending]*

`schemaId` is no longer used as OnchainKit now defaults to using Coinbase
attestations for the `<Badge />` component.

This prop will be removed in a future version of OnchainKit.

# <OnchainKitProvider />

Provides the OnchainKit React Context to the app.

## Usage

```tsx app.tsx
// @noErrors: 2304 - Cannot find name 'MyComponent'
import { base } from 'viem/chains';
import { OnchainKitProvider } from '@coinbase/onchainkit';

const App = () => {
  return (
    <OnchainKitProvider
      config={{
        appearance: {
          name: 'OnchainKit Playground',
          logo: 'https://onchainkit.xyz/favicon/48x48.png?v4-19-24',
          mode: 'auto',
          theme: 'default',
        },
      }}
      chain={base}
    >
      <MyComponent />
    </OnchainKitProvider>
  );
};
```

## Props

[`OnchainKitProviderReact`](/onchainkit/config/types#onchainkitproviderreact)

| Prop                       | Description                                                                                                                                                                                    | Required |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| [`chain`](#chain)          | The chain that your OnchainKit project supports.                                                                                                                                               | Yes      |
| [`apiKey`](#apikey)        | Client API Key from Coinbase Developer Platform.                                                                                                                                               | No       |
| [`rpcUrl`](#rpc-url)       | RPC URL for onchain requests.                                                                                                                                                                  | No       |
| [`projectId`](#project-id) | Your Coinbase Developer Platform Project ID.                                                                                                                                                   | No       |
| [`config`](#config)        | - `config.appearance` — Customize your OnchainKit project's appearance <br /> - `config.paymaster` — Paymaster URL for gas sponsorship <br /> - `config.wallet` — Wallet configuration options | No       |
| [`schemaId`](#schema-id)   | *\[Deprecation Pending]* The schema ID for attestations from the Ethereum Attestation Service (EAS).                                                                                           | No       |
| [`address`](#address)      | *\[Deprecation Pending]* This prop is no longer used.                                                                                                                                          | No       |

### Chain

`chain` specifies the chain on which your OnchainKit project will operate.

This prop is required for all OnchainKit components.

We recommend importing chain data from [viem](https://viem.sh/docs/chains/introduction).

### `apiKey`

`apiKey` is your Coinbase Developer Platform Client API Key.

This prop is required for most OnchainKit components, including:

* [`<Checkout>`](/onchainkit/checkout/checkout)
* [`<NFTCard>`](/onchainkit/mint/nft-card)
* [`<NFTMintCard>`](/onchainkit/mint/nft-mint-card)
* [`<Swap>`](/onchainkit/swap/swap)
* [`<Transaction>`](/onchainkit/transaction/transaction)

You can get a [Client API Key](https://portal.cdp.coinbase.com/projects/project-id/api-keys/client-key)
from Coinbase Developer Platform.

<Frame>
  <img alt="OnchainKit copy Client API Key" src="https://mintcdn.com/base-a060aa97/images/onchainkit/copy-api-key-guide.png?maxW=3484&auto=format&n=Du4siypi4SZNnQsO&q=85&s=0855dc6995d5355dd49ab43da614df1e" height="364" width="3484" height="1050" data-path="images/onchainkit/copy-api-key-guide.png" srcset="https://mintcdn.com/base-a060aa97/images/onchainkit/copy-api-key-guide.png?w=280&maxW=3484&auto=format&n=Du4siypi4SZNnQsO&q=85&s=39a66c0b02320d490da3f81f9bf23c71 280w, https://mintcdn.com/base-a060aa97/images/onchainkit/copy-api-key-guide.png?w=560&maxW=3484&auto=format&n=Du4siypi4SZNnQsO&q=85&s=6adfaccce02319bae55d3a08d7e4136f 560w, https://mintcdn.com/base-a060aa97/images/onchainkit/copy-api-key-guide.png?w=840&maxW=3484&auto=format&n=Du4siypi4SZNnQsO&q=85&s=0ea03ec195831bc41e0041121722f893 840w, https://mintcdn.com/base-a060aa97/images/onchainkit/copy-api-key-guide.png?w=1100&maxW=3484&auto=format&n=Du4siypi4SZNnQsO&q=85&s=aeec9a29ed8aa8346477985c02be2a8a 1100w, https://mintcdn.com/base-a060aa97/images/onchainkit/copy-api-key-guide.png?w=1650&maxW=3484&auto=format&n=Du4siypi4SZNnQsO&q=85&s=3ece38bbaac2349fc41e2962ba4ca73a 1650w, https://mintcdn.com/base-a060aa97/images/onchainkit/copy-api-key-guide.png?w=2500&maxW=3484&auto=format&n=Du4siypi4SZNnQsO&q=85&s=938f12ad1465c49f2e4a8dbdf25bb835 2500w" data-optimize="true" data-opv="2" />
</Frame>

### RPC URL

`rpcUrl` is required for any onchain requests. If you provide your own RPC URL,
OnchainKit will use it.

If you do not provide your own RPC URL, you must provide an `apiKey`, which
enables OnchainKit to use the
[Coinbase Developer Platform Node](https://portal.cdp.coinbase.com/products/node).

### Project ID

`projectId` is your Coinbase Developer Platform Project ID.

This prop is required for the `<FundButton />` component.

You can obtain a Project ID from the [Coinbase Developer Platform](https://portal.cdp.coinbase.com/projects).

<Frame>
  <img alt="OnchainKit copy Project ID" src="https://mintcdn.com/base-a060aa97/images/onchainkit/copy-project-id.png?maxW=1247&auto=format&n=Du4siypi4SZNnQsO&q=85&s=03e025ca8e984e0d709d023f2cd370e5" height="364" width="1247" height="466" data-path="images/onchainkit/copy-project-id.png" srcset="https://mintcdn.com/base-a060aa97/images/onchainkit/copy-project-id.png?w=280&maxW=1247&auto=format&n=Du4siypi4SZNnQsO&q=85&s=f856f7113d6af745a4c021a0dbe45eb1 280w, https://mintcdn.com/base-a060aa97/images/onchainkit/copy-project-id.png?w=560&maxW=1247&auto=format&n=Du4siypi4SZNnQsO&q=85&s=7a049845edbbc04c76fc8d95b41b59e9 560w, https://mintcdn.com/base-a060aa97/images/onchainkit/copy-project-id.png?w=840&maxW=1247&auto=format&n=Du4siypi4SZNnQsO&q=85&s=5c2b50cb77eccaeb57c00ebd920b84d6 840w, https://mintcdn.com/base-a060aa97/images/onchainkit/copy-project-id.png?w=1100&maxW=1247&auto=format&n=Du4siypi4SZNnQsO&q=85&s=f66510287d5063c33ac118a76ac45c50 1100w, https://mintcdn.com/base-a060aa97/images/onchainkit/copy-project-id.png?w=1650&maxW=1247&auto=format&n=Du4siypi4SZNnQsO&q=85&s=c0df0664dbd24714736b3342616be841 1650w, https://mintcdn.com/base-a060aa97/images/onchainkit/copy-project-id.png?w=2500&maxW=1247&auto=format&n=Du4siypi4SZNnQsO&q=85&s=cd7801defdb2fb48183f668eae4de6fe 2500w" data-optimize="true" data-opv="2" />
</Frame>

### Config

`config` is an object that can be used to customize the appearance and behavior
of the OnchainKit components.

This prop has three keys: `appearance`, `paymaster`, and `wallet`.

#### Appearance

`appearance` manages the appearance of the OnchainKit components and has the following properties:

* `name` — The name of your OnchainKit project
* `logo` — The URL of the logo for your OnchainKit project
* `mode` — The mode of the OnchainKit components. Can be `auto`, `dark`, or `light`.
* `theme` — The theme of the OnchainKit components. Can be `base`, `cyberpunk`, `default`, `hacker`, or a custom theme.

Explore appearance options in the [OnchainKit Playground](https://onchainkit.xyz/playground).

#### Paymaster

`paymaster` represents the Paymaster URL that enables you to sponsor gas for your users.

You can configure your Paymaster and obtain your Paymaster URL from the
[Coinbase Developer Platform](https://portal.cdp.coinbase.com/products/bundler-and-paymaster).

#### Wallet

`wallet` configures the wallet connection experience and has the following properties:

* `display` — The display mode for the wallet interface. Can be either:
  * `'modal'` — Shows wallet connection in a modal overlay with wallet aggregation
  * `'classic'` — Shows wallet connection in the traditional inline style
* `termsUrl` — URL to your terms of service
* `privacyUrl` — URL to your privacy policy

### Address *\[Deprecation Pending]*

`address` is no longer used and will be removed in a future version of
OnchainKit.

### Schema ID *\[Deprecation Pending]*

`schemaId` is no longer used as OnchainKit now defaults to using Coinbase
attestations for the `<Badge />` component.

This prop will be removed in a future version of OnchainKit.
