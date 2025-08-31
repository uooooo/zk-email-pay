Contribution

Contribution Guide · OnchainKit

[Get Started](https://docs.base.org/get-started/base) [Base Chain](https://docs.base.org/base-chain/quickstart/why-base) [Base Account](https://docs.base.org/base-account/overview/what-is-base-account) [Base App](https://docs.base.org/base-app/introduction/beta-faq) [Mini Apps](https://docs.base.org/mini-apps/overview) [OnchainKit](https://docs.base.org/onchainkit/getting-started) [Cookbook](https://docs.base.org/cookbook/onboard-any-user) [Showcase](https://docs.base.org/showcase) [Learn](https://docs.base.org/learn/welcome)

On this page

- [Setup](https://docs.base.org/onchainkit/guides/contribution#setup)
- [Clone the repo](https://docs.base.org/onchainkit/guides/contribution#clone-the-repo)
- [Install Node and pnpm](https://docs.base.org/onchainkit/guides/contribution#install-node-and-pnpm)
- [Install dependencies](https://docs.base.org/onchainkit/guides/contribution#install-dependencies)
- [Codebase](https://docs.base.org/onchainkit/guides/contribution#codebase)
- [Workflows](https://docs.base.org/onchainkit/guides/contribution#workflows)
- [Development](https://docs.base.org/onchainkit/guides/contribution#development)
- [Building](https://docs.base.org/onchainkit/guides/contribution#building)
- [Testing](https://docs.base.org/onchainkit/guides/contribution#testing)
- [Updating changelog](https://docs.base.org/onchainkit/guides/contribution#updating-changelog)
- [Feature request](https://docs.base.org/onchainkit/guides/contribution#feature-request)

Welcome to OnchainKit! So you want to contribute to this project? You came to the right place.In this guide, you will learn how to:

- [Set up this project](https://docs.base.org/onchainkit/guides/contribution#setup)
- [Navigate the codebase](https://docs.base.org/onchainkit/guides/contribution#codebase)
- [Accomplish various workflows](https://docs.base.org/onchainkit/guides/contribution#workflows)
- [Submit a feature request](https://docs.base.org/onchainkit/guides/contribution#feature-request)

## [​](https://docs.base.org/onchainkit/guides/contribution\#setup)  Setup

### [​](https://docs.base.org/onchainkit/guides/contribution\#clone-the-repo)  Clone the repo

Copy

Ask AI

```
git clone git@github.com:coinbase/onchainkit.git

```

### [​](https://docs.base.org/onchainkit/guides/contribution\#install-node-and-pnpm)  Install Node and pnpm

Use nvm, mise, n or your favorite version manager to install Node.js.For pnpm, see the installation instructions on the [pnpm website](https://pnpm.io/installation).

### [​](https://docs.base.org/onchainkit/guides/contribution\#install-dependencies)  Install dependencies

From the root of the repository:

Copy

Ask AI

```
pnpm install

```

## [​](https://docs.base.org/onchainkit/guides/contribution\#codebase)  Codebase

This project is a monorepo managed with pnpm. The `@coinbase/onchainkit` package is located in:

Copy

Ask AI

```
packages/onchainkit/

```

Here is a rough layout of the codebase:

Copy

Ask AI

```
packages/onchainkit/
└── src/
   ├── api/                         - API related components and functions
   ├── core/                        - Files with zero dependencies
   ├── styles/                      - Styles
   │   ├── index-with-tailwind.css  - CSS entrypoint
   ├── {Component}/                 - Component folder
   │   ├── components/              - React components
   │   │   ├── {Name}.tsx
   │   │   ├── {Name}.test.tsx
   │   │   └── {Name}.css
   │   ├── core/                    - Utility functions
   │   ├── index.ts                 - Entrypoint for the folder
   │   └── types.ts                 - Export types
   │
   ├── index.ts                     - Main package entry point
   ├── types.ts                     - Core types
   └── OnchainKitProvider.tsx       - OnchainKit provider

```

## [​](https://docs.base.org/onchainkit/guides/contribution\#workflows)  Workflows

### [​](https://docs.base.org/onchainkit/guides/contribution\#development)  Development

To work on OnchainKit components with live UI feedback:

Copy

Ask AI

```
pnpm f:play dev

```

This will build the OnchainKit package in watch mode, and start a development environment (the playground) where you can see your components in action.As you make changes, the playground will update automatically.Navigate to [http://localhost:3000](http://localhost:3000/) to open the playground.

### [​](https://docs.base.org/onchainkit/guides/contribution\#building)  Building

To build the package:

Copy

Ask AI

```
pnpm f:ock build

```

### [​](https://docs.base.org/onchainkit/guides/contribution\#testing)  Testing

Write and update existing unit tests. You can run tests with:

Copy

Ask AI

```
pnpm f:ock test

```

For watching file changes and rerunning tests automatically:

Copy

Ask AI

```
pnpm f:ock test:watch

```

We expect 100% code coverage for any updates. You can get coverage information with:

Copy

Ask AI

```
pnpm f:ock test:coverage

```

If the coverage drops below 100%, look at the coverage report generated by the above command with:

Copy

Ask AI

```
open coverage/index.html

```

### [​](https://docs.base.org/onchainkit/guides/contribution\#updating-changelog)  Updating changelog

To update the change log, run:

Copy

Ask AI

```
pnpm changeset

```

Select `minor` and use the following format for the summary:

Copy

Ask AI

```
- **feat**: feature update information. By @your-github-id #XX (XX is the PR number)

```

Possible values are:

- `feat`
- `fix`
- `docs`
- `chore`

## [​](https://docs.base.org/onchainkit/guides/contribution\#feature-request)  Feature request

Have a component in mind that we are not supporting yet? You can submit a feature request to our [Github](https://github.com/coinbase/onchainkit/issues). Create a **“New issue”** and label it “Feature Request: …”.

Was this page helpful?

YesNo

[Suggest edits](https://github.com/base/docs/edit/master/docs/onchainkit/guides/contribution.mdx) [Raise issue](https://github.com/base/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/onchainkit/guides/contribution)

[Wallet](https://docs.base.org/onchainkit/wallet/types) [Reporting a bug](https://docs.base.org/onchainkit/guides/reporting-bug)

Assistant

Responses are generated using AI and may contain mistakes.