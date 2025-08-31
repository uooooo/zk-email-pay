Introduction

Telemetry · OnchainKit

[Get Started](https://docs.base.org/get-started/base) [Base Chain](https://docs.base.org/base-chain/quickstart/why-base) [Base Account](https://docs.base.org/base-account/overview/what-is-base-account) [Base App](https://docs.base.org/base-app/introduction/beta-faq) [Mini Apps](https://docs.base.org/mini-apps/overview) [OnchainKit](https://docs.base.org/onchainkit/getting-started) [Cookbook](https://docs.base.org/cookbook/onboard-any-user) [Showcase](https://docs.base.org/showcase) [Learn](https://docs.base.org/learn/welcome)

On this page

- [Why Are We Collecting Telemetry?](https://docs.base.org/onchainkit/guides/telemetry#why-are-we-collecting-telemetry%3F)
- [What Data Will Be Collected?](https://docs.base.org/onchainkit/guides/telemetry#what-data-will-be-collected%3F)
- [How Does It Work?](https://docs.base.org/onchainkit/guides/telemetry#how-does-it-work%3F)
- [How Do I Opt Out?](https://docs.base.org/onchainkit/guides/telemetry#how-do-i-opt-out%3F)

OnchainKit is introducing an anonymous telemetry system to help us better understand how our library is used in the wild. Participation in this anonymous program is optional—if you’d prefer not to share any usage data, you can easily opt out.

### [​](https://docs.base.org/onchainkit/guides/telemetry\#why-are-we-collecting-telemetry%3F)  Why Are We Collecting Telemetry?

OnchainKit has quickly become a go-to full‑stack component library for integrating essential onchain functionality (like `<Wallet />`, `<Transaction />`, and `<Swap />`) in minutes. Until now, our usage insights have been limited to public npm download counts and API endpoint usage. By collecting telemetry data, we can:

- **Gauge Component Usage**: Understand which components (and their variants) are most popular
- **Data-Informed Improvements**: Help our data science team generate insights that drive future enhancements and refactoring decisions
- **Proactive Monitoring**: Quickly detect issues with new releases or API changes through a dedicated error event stream (with alerts to oncall engineers)

### [​](https://docs.base.org/onchainkit/guides/telemetry\#what-data-will-be-collected%3F)  What Data Will Be Collected?

Telemetry data is completely anonymous and designed to provide aggregated insights. Specifically, we collect:

- **Command Details**: Which commands (or component events) are being invoked (e.g. walletConnection, swapSuccess)
- **Version & App Info**: The OnchainKit version, app name (from window.top.document.title), and origin (the app URL)
- **Usage Metrics**: Information such as the number of unique wallets, transactions, or contracts interacting with OnchainKit
- **Error Events**: Generic error events along with component context to help us triage any issues

No sensitive data—such as environment variables, file paths, or private keys—is ever collected.

### [​](https://docs.base.org/onchainkit/guides/telemetry\#how-does-it-work%3F)  How Does It Work?

Telemetry is integrated directly into each applicable component via our new `sendAnalytics` function. When a component event occurs (e.g. a successful transaction or a wallet connection), this function automatically fires (provided analytics is enabled in your OnchainKit config).For example, a telemetry event might be sent as follows:

Copy

Ask AI

```
curl -X POST https://api.developer.coinbase.com/rpc/analytics \
  -H "Content-Type: application/json" \
  -H "OnchainKit-Version: 0.37.0" \
  -H "OnchainKit-App-Name: My Example App" \
  -H "Origin: www.example-app.vercel.app" \
  -d '{
    "eventType": "transactionSuccess",
    "apiKey": "ozpCtG8CfD3TIod_1Va7UBsUm5Rn1",
    "data": {
      "address": "0x...",
      "contract": "0x...",
      "transactionHash": "0x...",
      "sponsored": true
    }
  }'

```

### [​](https://docs.base.org/onchainkit/guides/telemetry\#how-do-i-opt-out%3F)  How Do I Opt Out?

By default, telemetry is opt‑out starting with version 0.37.0. If you’d like to disable telemetry, simply set the `analytics` flag to `false` in your OnchainKit configuration:

Copy

Ask AI

```
// @noErrors:  2304
export function Providers(props: { children: ReactNode }) {
  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={base}
      config={{
        analytics: false
      }}
    >
      {props.children}
    </OnchainKitProvider>
  );
}

```

You can also re‑enable analytics later by toggling this flag to `true`.We believe that this telemetry initiative will help us make OnchainKit even better for all developers—by focusing our improvements on the most used features and catching issues early. If you have any questions or feedback, please reach out to the OnchainKit team.Happy building!— The OnchainKit core team

Was this page helpful?

YesNo

[Suggest edits](https://github.com/base/docs/edit/master/docs/onchainkit/guides/telemetry.mdx) [Raise issue](https://github.com/base/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/onchainkit/guides/telemetry)

[Getting Started](https://docs.base.org/onchainkit/getting-started) [Troubleshooting](https://docs.base.org/onchainkit/guides/troubleshooting)

Assistant

Responses are generated using AI and may contain mistakes.