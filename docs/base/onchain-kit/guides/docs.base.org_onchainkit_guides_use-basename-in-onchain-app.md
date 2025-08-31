Guides

Use Basename · OnchainKit

[Get Started](https://docs.base.org/get-started/base) [Base Chain](https://docs.base.org/base-chain/quickstart/why-base) [Base Account](https://docs.base.org/base-account/overview/what-is-base-account) [Base App](https://docs.base.org/base-app/introduction/beta-faq) [Mini Apps](https://docs.base.org/mini-apps/overview) [OnchainKit](https://docs.base.org/onchainkit/getting-started) [Cookbook](https://docs.base.org/cookbook/onboard-any-user) [Showcase](https://docs.base.org/showcase) [Learn](https://docs.base.org/learn/welcome)

On this page

- [React components with <Avatar> and <Name>](https://docs.base.org/onchainkit/guides/use-basename-in-onchain-app#react-components-with-%3Cavatar%3E-and-%3Cname%3E)
- [React hooks with useAvatar and useName](https://docs.base.org/onchainkit/guides/use-basename-in-onchain-app#react-hooks-with-useavatar-and-usename)
- [Typescript utility with getAvatar and getName](https://docs.base.org/onchainkit/guides/use-basename-in-onchain-app#typescript-utility-with-getavatar-and-getname)

Basenames are an essential onchain building block that empowers builders to establish their identity on Base by registering human-readable names for their wallet addresses.They operate entirely onchain, utilizing the same technology as ENS names, and are deployed on Base.You can integrate [Basenames](https://www.base.org/names) into your app with these few steps.

1

New to OnchainKit?

Follow the [Getting Started](https://docs.base.org/onchainkit/getting-started) guide to install the package.

2

Already using OnchainKit?

Update to the latest version and choose from the following steps: a React component approach, a React hook, or a pure TypeScript utility function.

## [​](https://docs.base.org/onchainkit/guides/use-basename-in-onchain-app\#react-components-with-%3Cavatar%3E-and-%3Cname%3E)  React components with `<Avatar>` and `<Name>`

Use the [`<Avatar>`](https://docs.base.org/onchainkit/identity/avatar) and [`<Name>`](https://docs.base.org/onchainkit/identity/name) components to display Basenames associated with Ethereum addresses.The `chain` prop is optional and setting to Base, it’s what makes the components switch from ENS to Basenames.

Copy

Ask AI

```
// @noErrors: 2657 - JSX expressions must have one parent element
import { Avatar, Name } from '@coinbase/onchainkit/identity';
import { base } from 'viem/chains';

const address = '0x02feeb0AdE57b6adEEdE5A4EEea6Cf8c21BeB6B1';

// omitted component code for brevity
<Avatar address={address} chain={base} />
<Name address={address} chain={base} />

```

onchainkit-identity-identity--use-basename-in-onchain-app

| Name | Description | Default | Control |
| --- | --- | --- | --- |
| propertyName\* | This is a short description<br>summary | defaultValue | Set string |
| propertyName\* | This is a short description<br>summary | defaultValue | Set string |
| propertyName\* | This is a short description<br>summary | defaultValue | Set string |

# No Preview

Sorry, but you either have no stories or none are selected somehow.

- Please check the Storybook config.
- Try reloading the page.

If the problem persists, check the browser console, or the terminal you've run Storybook from.

The component failed to render properly, likely due to a configuration issue in Storybook. Here are some common causes and how you can address them:

1. **Missing Context/Providers**: You can use decorators to supply specific contexts or providers, which are sometimes necessary for components to render correctly. For detailed instructions on using decorators, please visit the [Decorators documentation](https://storybook.js.org/docs/writing-stories/decorators).
2. **Misconfigured Webpack or Vite**: Verify that Storybook picks up all necessary settings for loaders, plugins, and other relevant parameters. You can find step-by-step guides for configuring [Webpack](https://storybook.js.org/docs/builders/webpack) or [Vite](https://storybook.js.org/docs/builders/vite) with Storybook.
3. **Missing Environment Variables**: Your Storybook may require specific environment variables to function as intended. You can set up custom environment variables as outlined in the [Environment Variables documentation](https://storybook.js.org/docs/configure/environment-variables).

```

```

![zizzamia.eth](<Base64-Image-Removed>)

zizzamia.eth

## [​](https://docs.base.org/onchainkit/guides/use-basename-in-onchain-app\#react-hooks-with-useavatar-and-usename)  React hooks with `useAvatar` and `useName`

Use the [`useAvatar`](https://docs.base.org/onchainkit/identity/use-avatar) and [`useName`](https://docs.base.org/onchainkit/identity/use-name) hooks to get Basenames associated with Ethereum addresses.The hooks are incredibly useful for building custom components while leveraging OnchainKit for efficient data fetching.

code

return value

Copy

Ask AI

```
import { useAvatar, useName } from '@coinbase/onchainkit/identity';
import { base } from 'viem/chains';

const address = '0x02feeb0AdE57b6adEEdE5A4EEea6Cf8c21BeB6B1';
const basename = 'zizzamia.base.eth';
const { data: avatar, isLoading: avatarIsLoading } = await useAvatar({ ensName: basename, chain: base });
const { data: name, isLoading: nameIsLoading } = await useName({ address, chain: base });

```

## [​](https://docs.base.org/onchainkit/guides/use-basename-in-onchain-app\#typescript-utility-with-getavatar-and-getname)  Typescript utility with `getAvatar` and `getName`

Use the [`getAvatar`](https://docs.base.org/onchainkit/identity/get-avatar) and [`getName`](https://docs.base.org/onchainkit/identity/get-name) functions to get Basenames associated with Ethereum addresses.Being pure functions, it seamlessly integrates into any TypeScript project, including Vue, Angular, Svelte, or Node.js.

code

return value

Copy

Ask AI

```
import { getAvatar, getName } from '@coinbase/onchainkit/identity';
import { base } from 'viem/chains';

const address = '0x02feeb0AdE57b6adEEdE5A4EEea6Cf8c21BeB6B1';
const basename = 'zizzamia.base.eth';
const avatar = await getAvatar({ ensName: basename, chain: base });
const name = await getName({ address, chain: base });

```

Was this page helpful?

YesNo

[Suggest edits](https://github.com/base/docs/edit/master/docs/onchainkit/guides/use-basename-in-onchain-app.mdx) [Raise issue](https://github.com/base/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/onchainkit/guides/use-basename-in-onchain-app)

[OnchainKit Themes](https://docs.base.org/onchainkit/guides/themes) [Use AI-powered IDEs](https://docs.base.org/onchainkit/guides/using-ai-powered-ides)

Assistant

Responses are generated using AI and may contain mistakes.