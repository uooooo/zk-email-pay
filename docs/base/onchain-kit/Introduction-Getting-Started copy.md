# Getting Started

OnchainKit is your go-to SDK for building beautiful onchain applications. Ship in minutes, not weeks.

Anyone can build an onchain app in 15 minutes with OnchainKit. No blockchain experience required.

## Why OnchainKit?

OnchainKit streamlines app development by providing a comprehensive toolkit that combines powerful onchain features with developer-friendly design:

* **Ergonomic design:** Full-stack tools that make complex onchain interactions intuitive
* **Battle-tested patterns:** Industry best practices packaged into ready-to-use solutions
* **Purpose-built components:** Pre-built modules for common onchain workflows
* **Framework agnostic:** Compatible with any React-supporting framework
* **Supercharged by Base:** Deep integration with Base's protocol features and ecosystem

## Automatic Installation

<Frame>
  <img alt="OnchainKit Template" src="https://mintcdn.com/base-a060aa97/images/onchainkit/quickstart.png?maxW=3012&auto=format&n=Du4siypi4SZNnQsO&q=85&s=091b1f373817bb2cb18d309f374cb588" height="364" width="3012" height="1700" data-path="images/onchainkit/quickstart.png" srcset="https://mintcdn.com/base-a060aa97/images/onchainkit/quickstart.png?w=280&maxW=3012&auto=format&n=Du4siypi4SZNnQsO&q=85&s=a9e0b104cb612b3abaffc02a00d43e65 280w, https://mintcdn.com/base-a060aa97/images/onchainkit/quickstart.png?w=560&maxW=3012&auto=format&n=Du4siypi4SZNnQsO&q=85&s=75c6e07eac4b7e21e573283b8f962632 560w, https://mintcdn.com/base-a060aa97/images/onchainkit/quickstart.png?w=840&maxW=3012&auto=format&n=Du4siypi4SZNnQsO&q=85&s=11f7e6fe5da593e80c21d3e7743fc13e 840w, https://mintcdn.com/base-a060aa97/images/onchainkit/quickstart.png?w=1100&maxW=3012&auto=format&n=Du4siypi4SZNnQsO&q=85&s=a81513fc0959c48a6c9b2990706003f5 1100w, https://mintcdn.com/base-a060aa97/images/onchainkit/quickstart.png?w=1650&maxW=3012&auto=format&n=Du4siypi4SZNnQsO&q=85&s=9de626d83d9f1183f1f5dfaa877b19bd 1650w, https://mintcdn.com/base-a060aa97/images/onchainkit/quickstart.png?w=2500&maxW=3012&auto=format&n=Du4siypi4SZNnQsO&q=85&s=30bf64ffb950ebb25337b6484550ac21 2500w" data-optimize="true" data-opv="2" />
</Frame>

We recommend starting a new OnchainKit app using `create onchain`, which sets up everything automatically for you. To create a project, run:

```bash Terminal
npm create onchain@latest
```

After the prompts, `create onchain` will create a folder with your project name and install the required dependencies.

You can also checkout our pre-built templates:

* [Onchain Commerce](https://onchain-commerce-template.vercel.app/)
* [NFT minting](https://ock-mint.vercel.app/)
* [Funding flow](https://github.com/fakepixels/fund-component)
* [Social profile](https://github.com/fakepixels/ock-identity)

<Check>
  These docs are LLM-friendly—reference [OnchainKit AI Prompting Guide](/onchainkit/guides/ai-prompting-guide) in your code editor to streamline builds and prompt smarter.
</Check>

## Manual Installation

Add OnchainKit to your existing project manually.

<CardGroup cols={2}>
  <Card
    title="Next.js"
    href="/onchainkit/installation/nextjs"
    icon={<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="32px" height="32px" viewBox="0 0 256 256" version="1.1" preserveAspectRatio="xMidYMid">
    <g>
      <path d="M119.616813,0.0688905149 C119.066276,0.118932037 117.314565,0.294077364 115.738025,0.419181169 C79.3775171,3.69690087 45.3192571,23.3131775 23.7481916,53.4631946 C11.7364614,70.2271045 4.05395894,89.2428829 1.15112414,109.384595 C0.12512219,116.415429 0,118.492153 0,128.025062 C0,137.557972 0.12512219,139.634696 1.15112414,146.665529 C8.10791789,194.730411 42.3163245,235.11392 88.7116325,250.076335 C97.0197458,252.753556 105.778299,254.580072 115.738025,255.680985 C119.616813,256.106338 136.383187,256.106338 140.261975,255.680985 C157.453763,253.779407 172.017986,249.525878 186.382014,242.194795 C188.584164,241.068861 189.00958,240.768612 188.709286,240.518404 C188.509091,240.36828 179.124927,227.782837 167.86393,212.570214 L147.393939,184.922273 L121.743891,146.965779 C107.630108,126.098464 96.0187683,109.034305 95.9186706,109.034305 C95.8185728,109.009284 95.7184751,125.873277 95.6684262,146.465363 C95.5933529,182.52028 95.5683284,183.971484 95.1178886,184.82219 C94.4672532,186.048207 93.9667644,186.548623 92.915738,187.099079 C92.114956,187.499411 91.4142717,187.574474 87.6355816,187.574474 L83.3063539,187.574474 L82.1552297,186.848872 C81.4044966,186.373477 80.8539589,185.747958 80.4785924,185.022356 L79.9530792,183.896422 L80.0031281,133.729796 L80.0782014,83.5381493 L80.8539589,82.5623397 C81.25435,82.0369037 82.1051808,81.3613431 82.7057674,81.0360732 C83.7317693,80.535658 84.1321603,80.4856165 88.4613881,80.4856165 C93.5663734,80.4856165 94.4172043,80.6857826 95.7434995,82.1369867 C96.1188661,82.5373189 110.007429,103.454675 126.623656,128.650581 C143.239883,153.846488 165.962072,188.250034 177.122972,205.139048 L197.392766,235.839522 L198.418768,235.163961 C207.502639,229.259062 217.112023,220.852086 224.719453,212.09482 C240.910264,193.504394 251.345455,170.835585 254.848876,146.665529 C255.874878,139.634696 256,137.557972 256,128.025062 C256,118.492153 255.874878,116.415429 254.848876,109.384595 C247.892082,61.3197135 213.683675,20.9362052 167.288368,5.97379012 C159.105376,3.32158945 150.396872,1.49507389 140.637341,0.394160408 C138.234995,0.143952798 121.693842,-0.131275573 119.616813,0.0688905149 L119.616813,0.0688905149 Z M172.017986,77.4831252 C173.219159,78.0836234 174.195112,79.2345784 174.545455,80.435575 C174.74565,81.0861148 174.795699,94.9976579 174.74565,126.348671 L174.670577,171.336 L166.73783,159.17591 L158.780059,147.01582 L158.780059,114.313685 C158.780059,93.1711423 158.880156,81.2862808 159.030303,80.7108033 C159.430694,79.3096407 160.306549,78.2087272 161.507722,77.5581875 C162.533724,77.0327515 162.909091,76.98271 166.837928,76.98271 C170.541544,76.98271 171.19218,77.0327515 172.017986,77.4831252 Z" fill="currentColor">
  </path>
      </g>
  </svg>}
  />

  <Card
    title="Vite"
    href="/onchainkit/installation/vite"
    icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="a" x1="6" x2="235" y1="33" y2="344" gradientTransform="translate(0 .937) scale(.3122)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#41d1ff"/><stop offset="1" stop-color="#bd34fe"/></linearGradient><linearGradient id="b" x1="194.651" x2="236.076" y1="8.818" y2="292.989" gradientTransform="translate(0 .937) scale(.3122)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffea83"/><stop offset=".083" stop-color="#ffdd35"/><stop offset="1" stop-color="#ffa800"/></linearGradient></defs><path fill="url(#a)" d="M124.766 19.52 67.324 122.238c-1.187 2.121-4.234 2.133-5.437.024L3.305 19.532c-1.313-2.302.652-5.087 3.261-4.622L64.07 25.187a3.09 3.09 0 0 0 1.11 0l56.3-10.261c2.598-.473 4.575 2.289 3.286 4.594Zm0 0"/><path fill="url(#b)" d="M91.46 1.43 48.954 9.758a1.56 1.56 0 0 0-1.258 1.437l-2.617 44.168a1.563 1.563 0 0 0 1.91 1.614l11.836-2.735a1.562 1.562 0 0 1 1.88 1.836l-3.517 17.219a1.562 1.562 0 0 0 1.985 1.805l7.308-2.223c1.133-.344 2.223.652 1.985 1.812l-5.59 27.047c-.348 1.692 1.902 2.614 2.84 1.164l.625-.968 34.64-69.13c.582-1.16-.421-2.48-1.69-2.234l-12.185 2.352a1.558 1.558 0 0 1-1.793-1.965l7.95-27.562A1.56 1.56 0 0 0 91.46 1.43Zm0 0"/></svg>
}
  />

  <Card
    title="Remix"
    href="/onchainkit/installation/remix"
    icon={<svg viewBox="0 0 411 473" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M392.946 364.768C397.201 419.418 397.201 445.036 397.201 473H270.756C270.756 466.909 270.865 461.337 270.975 455.687C271.317 438.123 271.674 419.807 268.828 382.819C265.067 328.667 241.748 316.634 198.871 316.634H160.883H0V218.109H204.889C259.049 218.109 286.13 201.633 286.13 158.011C286.13 119.654 259.049 96.4098 204.889 96.4098H0V0H227.456C350.069 0 411 57.9117 411 150.42C411 219.613 368.123 264.739 310.201 272.26C359.096 282.037 387.681 309.865 392.946 364.768Z"
      className="ock-fill-default-reverse"
      stroke="currentColor"
      strokeWidth="12"
    />
    <path
      d="M0 473V399.553H133.697C156.029 399.553 160.878 416.116 160.878 425.994V473H0Z"
      className="ock-fill-default-reverse"
      stroke="currentColor"
      strokeWidth="12"
    />
  </svg>}
  />

  <Card
    title="Astro"
    href="/onchainkit/installation/astro"
    icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="a" x1="882.997" x2="638.955" y1="27.113" y2="866.902" gradientTransform="scale(.1)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#000014"/><stop offset="1" stop-color="#150426"/></linearGradient><linearGradient id="b" x1="1001.68" x2="790.326" y1="652.45" y2="1094.91" gradientTransform="scale(.1)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ff1639"/><stop offset="1" stop-color="#ff1639" stop-opacity="0"/></linearGradient></defs><path fill="url(#a)" d="M81.504 9.465c.973 1.207 1.469 2.836 2.457 6.09l21.656 71.136a90.079 90.079 0 0 0-25.89-8.765L65.629 30.28a1.833 1.833 0 0 0-3.52.004L48.18 77.902a90.104 90.104 0 0 0-26.003 8.778l21.758-71.14c.996-3.25 1.492-4.876 2.464-6.083a8.023 8.023 0 0 1 3.243-2.398c1.433-.575 3.136-.575 6.535-.575H71.72c3.402 0 5.105 0 6.543.579a7.988 7.988 0 0 1 3.242 2.402Zm0 0"/><path fill="#ff5d01" d="M84.094 90.074c-3.57 3.055-10.696 5.137-18.903 5.137-10.07 0-18.515-3.137-20.754-7.356-.8 2.418-.98 5.184-.98 6.954 0 0-.527 8.675 5.508 14.71a5.671 5.671 0 0 1 5.672-5.671c5.37 0 5.367 4.683 5.363 8.488v.336c0 5.773 3.527 10.719 8.543 12.805a11.62 11.62 0 0 1-1.172-5.098c0-5.508 3.23-7.555 6.988-9.938 2.989-1.894 6.309-4 8.594-8.222a15.513 15.513 0 0 0 1.875-7.41 15.55 15.55 0 0 0-.734-4.735Zm0 0"/><path fill="url(#b)" d="M84.094 90.074c-3.57 3.055-10.696 5.137-18.903 5.137-10.07 0-18.515-3.137-20.754-7.356-.8 2.418-.98 5.184-.98 6.954 0 0-.527 8.675 5.508 14.71a5.671 5.671 0 0 1 5.672-5.671c5.37 0 5.367 4.683 5.363 8.488v.336c0 5.773 3.527 10.719 8.543 12.805a11.62 11.62 0 0 1-1.172-5.098c0-5.508 3.23-7.555 6.988-9.938 2.989-1.894 6.309-4 8.594-8.222a15.513 15.513 0 0 0 1.875-7.41 15.55 15.55 0 0 0-.734-4.735Zm0 0"/></svg>
}
  />
</CardGroup>

## Testing Your OnchainKit App

Build reliable applications with comprehensive end-to-end testing using [OnchainTestKit](/onchainkit/guides/testing-with-onchaintestkit). Test wallet connections, transactions, and complex user flows with automated browser testing.

## Start building!

Explore our ready-to-use onchain components:

* [**`Identity`**](/onchainkit/identity/identity) – Show [Basenames](/onchainkit/identity/identity), [avatars](/onchainkit/identity/avatar), [badges](/onchainkit/identity/badge), and [addresses](/onchainkit/identity/address).
* [**`Wallet`**](/onchainkit/wallet/wallet) – Create or connect wallets with [Connect Wallet](/onchainkit/wallet/wallet).
* [**`Transaction`**](/onchainkit/transaction/transaction) – Handle [transactions](/onchainkit/transaction/transaction) using EOAs or Smart Wallets.
* [**`Checkout`**](/onchainkit/checkout/checkout) – Integrate USDC [checkout](/onchainkit/checkout/checkout) flows with ease.
* [**`Fund`**](/onchainkit/fund/fund-button) – Create a [funding](/onchainkit/fund/fund-button) flow to onboard users.
* [**`Tokens`**](/onchainkit/token/token-chip) – Search and display [tokens](/onchainkit/token/token-chip) with various components.
* [**`Swap`**](/onchainkit/swap/swap) – Enable [token swaps](/onchainkit/swap/swap) in your app.
* [**`Mint`**](/onchainkit/mint/nft-mint-card) – [View](/onchainkit/mint/nft-mint-card) and [Mint](/onchainkit/mint/nft-mint-card) NFTs in your app.
