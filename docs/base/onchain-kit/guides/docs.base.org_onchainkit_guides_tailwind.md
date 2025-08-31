Guides

Tailwind CSS Integration Guide · OnchainKit

[Get Started](https://docs.base.org/get-started/base) [Base Chain](https://docs.base.org/base-chain/quickstart/why-base) [Base Account](https://docs.base.org/base-account/overview/what-is-base-account) [Base App](https://docs.base.org/base-app/introduction/beta-faq) [Mini Apps](https://docs.base.org/mini-apps/overview) [OnchainKit](https://docs.base.org/onchainkit/getting-started) [Cookbook](https://docs.base.org/cookbook/onboard-any-user) [Showcase](https://docs.base.org/showcase) [Learn](https://docs.base.org/learn/welcome)

OnchainKit comes with first class support for `tailwindcss`.

1

Use default OnchainKit's style

You can use the default styles without any customization.
Just place this at the top of your application’s entry point to have the components work out of the box.

Copy

Ask AI

```
import '@coinbase/onchainkit/styles.css';

```

2

Tailwind CSS Config

Depending on your dark mode setup, you may have to add `safelist: ['dark']` to your Tailwind config.

Copy

Ask AI

```
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: ['class'],
  safelist: ['dark'],
  theme: {
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
    },
  },
  plugins: [],
};

```

3

Toggling light / dark mode

There are many ways to handle color mode.In OnchainKit, toggling color mode works by adding / removing class name `dark` to the root html tag.

4

Colorscheme override

To override default colorscheme, you need to modify the following css variables:

Copy

Ask AI

```
@tailwind base;

@layer base {
  :root {
    --ock-font-family: 'your-custom-value';
    --ock-border-radius: 'your-custom-value';
    --ock-border-radius-inner: 'your-custom-value';
    --ock-text-inverse: 'your-custom-value';
    --ock-text-foreground: 'your-custom-value';
    --ock-text-foreground-muted: 'your-custom-value';
    --ock-text-error: 'your-custom-value';
    --ock-text-primary: 'your-custom-value';
    --ock-text-success: 'your-custom-value';
    --ock-text-warning: 'your-custom-value';
    --ock-text-disabled: 'your-custom-value';

    --ock-bg-default: 'your-custom-value';
    --ock-bg-default-hover: 'your-custom-value';
    --ock-bg-default-active: 'your-custom-value';
    --ock-bg-alternate: 'your-custom-value';
    --ock-bg-alternate-hover: 'your-custom-value';
    --ock-bg-alternate-active: 'your-custom-value';
    --ock-bg-inverse: 'your-custom-value';
    --ock-bg-inverse-hover: 'your-custom-value';
    --ock-bg-inverse-active: 'your-custom-value';
    --ock-bg-primary: 'your-custom-value';
    --ock-bg-primary-hover: 'your-custom-value';
    --ock-bg-primary-active: 'your-custom-value';
    --ock-bg-primary-washed: 'your-custom-value';
    --ock-bg-primary-disabled: 'your-custom-value';
    --ock-bg-secondary: 'your-custom-value';
    --ock-bg-secondary-hover: 'your-custom-value';
    --ock-bg-secondary-active: 'your-custom-value';
    --ock-bg-error: 'your-custom-value';
    --ock-bg-warning: 'your-custom-value';
    --ock-bg-success: 'your-custom-value';
    --ock-bg-default-reverse: 'your-custom-value';

    --ock-icon-color-primary: 'your-custom-value';
    --ock-icon-color-foreground: 'your-custom-value';
    --ock-icon-color-foreground-muted: 'your-custom-value';
    --ock-icon-color-inverse: 'your-custom-value';
    --ock-icon-color-error: 'your-custom-value';
    --ock-icon-color-success: 'your-custom-value';
    --ock-icon-color-warning: 'your-custom-value';

    --ock-line-primary: 'your-custom-value';
    --ock-line-default: 'your-custom-value';
    --ock-line-heavy: 'your-custom-value';
    --ock-line-inverse: 'your-custom-value';
  }
}

```

Was this page helpful?

YesNo

[Suggest edits](https://github.com/base/docs/edit/master/docs/onchainkit/guides/tailwind.mdx) [Raise issue](https://github.com/base/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/onchainkit/guides/tailwind)

[Lifecycle Status](https://docs.base.org/onchainkit/guides/lifecycle-status) [OnchainKit Themes](https://docs.base.org/onchainkit/guides/themes)

Assistant

Responses are generated using AI and may contain mistakes.