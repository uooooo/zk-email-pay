Guides

Lifecycle Status · OnchainKit

[Get Started](https://docs.base.org/get-started/base) [Base Chain](https://docs.base.org/base-chain/quickstart/why-base) [Base Account](https://docs.base.org/base-account/overview/what-is-base-account) [Base App](https://docs.base.org/base-app/introduction/beta-faq) [Mini Apps](https://docs.base.org/mini-apps/overview) [OnchainKit](https://docs.base.org/onchainkit/getting-started) [Cookbook](https://docs.base.org/cookbook/onboard-any-user) [Showcase](https://docs.base.org/showcase) [Learn](https://docs.base.org/learn/welcome)

On this page

- [How to listen to the Lifecycle Status](https://docs.base.org/onchainkit/guides/lifecycle-status#how-to-listen-to-the-lifecycle-status)
- [Lifecycle Status](https://docs.base.org/onchainkit/guides/lifecycle-status#lifecycle-status)
- [init](https://docs.base.org/onchainkit/guides/lifecycle-status#init)
- [success](https://docs.base.org/onchainkit/guides/lifecycle-status#success)
- [error](https://docs.base.org/onchainkit/guides/lifecycle-status#error)
- [Lifecycle Status with <Swap />](https://docs.base.org/onchainkit/guides/lifecycle-status#lifecycle-status-with-%3Cswap-%2F%3E)
- [amountChange](https://docs.base.org/onchainkit/guides/lifecycle-status#amountchange)
- [transactionPending](https://docs.base.org/onchainkit/guides/lifecycle-status#transactionpending)
- [transactionApproved](https://docs.base.org/onchainkit/guides/lifecycle-status#transactionapproved)
- [success](https://docs.base.org/onchainkit/guides/lifecycle-status#success-2)
- [Lifecycle Status with <Transaction />](https://docs.base.org/onchainkit/guides/lifecycle-status#lifecycle-status-with-%3Ctransaction-%2F%3E)
- [transactionIdle](https://docs.base.org/onchainkit/guides/lifecycle-status#transactionidle)
- [transactionPending](https://docs.base.org/onchainkit/guides/lifecycle-status#transactionpending-2)
- [success](https://docs.base.org/onchainkit/guides/lifecycle-status#success-3)

OnchainKit Lifecycle Status allows you to manage the state of APIs and onchain transactions seamlessly within components.

## [​](https://docs.base.org/onchainkit/guides/lifecycle-status\#how-to-listen-to-the-lifecycle-status)  How to listen to the Lifecycle Status

The Lifecycle Status is a TypeScript object that provides easy access to the `statusName` and `statusData` properties,
allowing you to stay informed and responsive.

Copy

Ask AI

```
import { useCallback } from 'react';
import { Transaction } from '@coinbase/onchainkit/transaction';
// ---cut-before---
import type { LifecycleStatus } from '@coinbase/onchainkit/transaction';

const handleOnStatus = useCallback((status: LifecycleStatus) => {
  console.log('LifecycleStatus', status);
}, []);

<Transaction onStatus={handleOnStatus}>
  // omitted component code for brevity
</Transaction>

```

## [​](https://docs.base.org/onchainkit/guides/lifecycle-status\#lifecycle-status)  Lifecycle Status

The Lifecycle Status includes 3 states common to all components:

### [​](https://docs.base.org/onchainkit/guides/lifecycle-status\#init)  `init`

The component is initialized and ready for use.

Copy

Ask AI

```
{
  statusName: 'init';
  statusData: null;
}

```

### [​](https://docs.base.org/onchainkit/guides/lifecycle-status\#success)  `success`

The component has successfully completed its main action, such as `swap` or `transaction`.

Copy

Ask AI

```
{
  statusName: 'success';
  statusData: {
    // the data returned from the API or onchain operation
  };
}

```

### [​](https://docs.base.org/onchainkit/guides/lifecycle-status\#error)  `error`

The component has encountered an issue while fetching API data, executing an onchain operation,
or needs to display a visual message to the user.

Copy

Ask AI

```
{
  statusName: 'error';
  statusData: {
    code: string; // The error code representing the location of the error
    error: string; // The error message providing developer details
    message: string; // The error message providing user-facing details
  };
}

```

Each component brings its own unique experience, and we have explored both the swap and transaction processes.

## [​](https://docs.base.org/onchainkit/guides/lifecycle-status\#lifecycle-status-with-%3Cswap-%2F%3E)  Lifecycle Status with [`<Swap />`](https://docs.base.org/onchainkit/swap/swap)

### [​](https://docs.base.org/onchainkit/guides/lifecycle-status\#amountchange)  `amountChange`

Any of the Swap Input fields have been updated.

Copy

Ask AI

```
{
  statusName: 'amountChange';
  statusData: {
    amountFrom: string;
    amountTo: string;
    tokenFrom?: Token;
    tokenTo?: Token;
    isMissingRequiredField: boolean;
  };
}

```

### [​](https://docs.base.org/onchainkit/guides/lifecycle-status\#transactionpending)  `transactionPending`

The transaction has been submitted to the network but has not yet been confirmed to be included in a block.
During this pending state, the transaction is waiting to be validated by the network’s consensus mechanism.

Copy

Ask AI

```
{
  statusName: 'transactionPending';
  statusData: null;
}

```

### [​](https://docs.base.org/onchainkit/guides/lifecycle-status\#transactionapproved)  `transactionApproved`

The transaction has been verified to be valid and it has been included in a block
however the transaction is not yet finalized.

Copy

Ask AI

```
{
  statusName: 'transactionApproved';
  statusData: {
    transactionHash: Hex;
    transactionType: 'Batched' | 'ERC20' | 'Permit2' | 'Swap';
  };
}

```

### [​](https://docs.base.org/onchainkit/guides/lifecycle-status\#success-2)  `success`

The transaction has been added to the blockchain and the transaction is considered final.

Copy

Ask AI

```
{
  statusName: 'success';
  statusData: {
    transactionReceipt: TransactionReceipt;
  };
}

```

## [​](https://docs.base.org/onchainkit/guides/lifecycle-status\#lifecycle-status-with-%3Ctransaction-%2F%3E)  Lifecycle Status with [`<Transaction />`](https://docs.base.org/onchainkit/transaction/transaction)

### [​](https://docs.base.org/onchainkit/guides/lifecycle-status\#transactionidle)  `transactionIdle`

The transaction component is waiting for the user to take action.

Copy

Ask AI

```
{
  statusName: 'transactionIdle';
  statusData: null;
}

```

### [​](https://docs.base.org/onchainkit/guides/lifecycle-status\#transactionpending-2)  `transactionPending`

The transaction has been submitted to the network but has not yet been confirmed to be included in a block.
During this pending state, the transaction is waiting to be validated by the network’s consensus mechanism.

Copy

Ask AI

```
{
  statusName: 'transactionPending';
  statusData: null;
}

```

### [​](https://docs.base.org/onchainkit/guides/lifecycle-status\#success-3)  `success`

The transaction has been added to the blockchain and the transaction is considered final.

Copy

Ask AI

```
{
  statusName: 'success';
  statusData: {
    transactionReceipts: TransactionReceipt[];
  };
}

```

Was this page helpful?

YesNo

[Suggest edits](https://github.com/base/docs/edit/master/docs/onchainkit/guides/lifecycle-status.mdx) [Raise issue](https://github.com/base/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/onchainkit/guides/lifecycle-status)

[Supplemental Providers](https://docs.base.org/onchainkit/config/supplemental-providers) [Tailwind CSS Integration Guide](https://docs.base.org/onchainkit/guides/tailwind)

Assistant

Responses are generated using AI and may contain mistakes.