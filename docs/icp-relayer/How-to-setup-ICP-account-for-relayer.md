## 1. Setup rust

Please make sure you installed the latest rust version.

https://www.rust-lang.org/tools/install

## 2. Install dfx

Please install dfx and the related clis.

https://internetcomputer.org/docs/current/developer-docs/getting-started/install

## 3. Get cycle from faucet

https://internetcomputer.org/docs/current/developer-docs/setup/cycles/cycles-faucet

### 3.1. Create an identity for IC mainnet

```jsx
% dfx identity new --network ic zkemail
% dfx identity use zkemail --network ic
```

### 3.2. Send ICP to your account

```jsx
$ dfx ledger account-id
> 2705d3658f34847ce0e1ee795fc65b501c4758a22dd77ee5816d9fc2715d8cdd
```

Please send ICP to the above address.

You can check the balance by the following command: 

```jsx
% dfx ledger balance --network ic
> 1.00000000 ICP

```

## 4. Deploy a wallet canister

You deploy a wallet canister for your account by the following steps:

1. Get a principal id by `dfx identity --network ic get-principal`.
2. Create a new canister by `dfx ledger --network ic create-canister <principal-identifier> --amount <icp-token-amount, such as 1.5>`. Please note the output canister id, which is used later as the wallet canister id.
3. Install the cycle wallet code to your canister by `dfx identity --network ic deploy-wallet <wallet-canister-id>`.

Ref: https://internetcomputer.org/docs/current/developer-docs/defi/cycles/cycles-wallet#creating-a-cycles-wallet

## 5. Export an account private key to a pem file.

You can export an account private key to a pem file as follows:

`dfx identity export zkemail > .ic.pem`

## 6. Modify configurations for ICP in the relayer

Here we explain how to modify configurations for ICP in the relayer designed for account recovery, located in https://github.com/zkemail/email-tx-builder/tree/email-recovery/packages/relayer

1. You first move the `.ic.pem` to the relayer directory, i.e., the path `relayer/.ic.pem` is correct.
2. You then modify the env value in `relayer/.env` as follows:
    - `DKIM_CANISTER_ID=<ic_dns_oracle_backend id>`, such as `DKIM_CANISTER_ID="fxmww-qiaaa-aaaaj-azu7a-cai"`.
    - The value of `WALLET_CANISTER_ID` is your wallet canister id deployed in Step 4.
    - The value of `IC_REPLICA_URL` corresponding to `DKIM_CANISTER_ID` is found [here](https://github.com/zkemail/ic-dns-oracle/tree/b4912031ccab5c2d406e7cd3c95d0b21ac966381?tab=readme-ov-file#how-to-try-our-canister). For example, the url for `fxmww-qiaaa-aaaaj-azu7a-cai` is https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=fxmww-qiaaa-aaaaj-azu7a-cai
    
    You can find the id of the canister we deployed from the following files:
    
    https://github.com/zkemail/ic-dns-oracle/blob/b4912031ccab5c2d406e7cd3c95d0b21ac966381/canister_ids.json#L6
    The value of `DKIM_CANISTER_ID` corresponds to `ic_dns_oracle_backend` in the above file.
    

## 7. Add more cycles to your wallet canister

You can run the following command to add more cycles to your wallet canister.

```jsx
dfx ledger --network=ic top-up --amount 0.1 <wallet-canister-id>
```

If you want to automate a process to monitor and add the amount of cycles, I recommend using [cycleops](https://cycleops.dev/).

You can also convert more ICPs to cycles and send them to your wallet canister by the following command:

```jsx
dfx ledger --network=ic top-up --amount <ICP-amount, such as 0.5> <wallet-canister-id>
```

## Appendix: Notes for developers

### Terms

There are numerous specialized terms used in ICP. 
Below, I provide brief explanations of the definitions and synonyms for terms that frequently appear. 
However, please double check the official ICP documentation as well since these explanations are based on my own understanding.

- canister: a unit of on-chain application, which is similar to a contract in the context of Ethereum.
- subnet: a group of nodes hosting each blockchain and MPC committee. Unlike Ethereum and most blockchain platforms, ICP has multiple number of independent blockchains, each of which makes a distinct consensus outputs in parallel. Each subnet usually consists of 13 nodes.
Ref:
https://wiki.internetcomputer.org/wiki/Subnet_blockchain
https://internetcomputer.org/docs/current/references/subnets/overview
https://internetcomputer.org/docs/current/developer-docs/getting-started/network-overview
- dfx: an official command tool to operate ICP.
Ref:
https://internetcomputer.org/docs/current/tutorials/developer-journey/level-0/intro-dfx
- ICP: a main token of the ICP network.
- cycle: a token used to pay fees for maintaining canisters on the ICP network. While it is similar to gas in Ethereum, there are some key differences:
    - You must explicitly convert ICP into cycles and charge each canister accordingly.
    - A price of cycles is calculated based on XDR (supplementary foreign exchange assets defined and maintained by the International Monetary Fund, IMF), so the conversion rate between ICP and cycles fluctuates.
    - When a canister is called by a user, the canister itself—not the user—has a responsibility to pay the required cycles for on-chain computation. Therefore, unless the canister’s application logic requires users to pay in cycles, there is a risk of cycle depletion through DoS attacks.
    - In addition, even if a canister is not called by any user, it still consumes cycles at regular intervals to maintain its storage. If the canister’s cycle balance falls below a certain threshold, the canister enters a “frozen” state, and if it is not refilled within roughly 30 days, the canister is deleted. Consequently, it is crucial for the canister’s manager to monitor and replenish the canister’s cycle balance as needed.
    
    Ref: https://internetcomputer.org/docs/current/developer-docs/getting-started/tokens-and-cycles
    
- cycle wallet canister: a canister for each user to manage cycles. As shown in Step 4 above, each user deploys a new canister (without any code) and then install the cycle wallet code into it. A user calls the cycle wallet canister when the user wants to top-up cycles to a specific canister, and call functions on another canister with paying some cycles for fees.
- controller: a owner of a canister. A canister is upgradable by default; therefore the controller can upgrade the implementation/code of the existing canister. To make the canister non-upgradable, you need to remove all controllers or set only a blackhole canister.
Ref: https://internetcomputer.org/docs/current/developer-docs/smart-contracts/overview/trust-in-canisters
- http outcall: a canister can request nodes of the subnet to call an arbitrary web API via HTTP. Specifically, an application logic in the canister can specify the HTTP request and then obtain the response if more than threshold number of nodes agree on the same response.
Ref: https://internetcomputer.org/docs/current/references/https-outcalls-how-it-works
- threshold ecdsa: a canister can request nodes of the subnet to generate a threshold ECDSA signature for a message specified by an application logic in the canister. Technically, each node holds a secret share of a master private key, and the output signature is verifiable with a public key corresponding to the master signing key. This feature allows smart contracts on Ethereum to verify the signature. The key pair is unique to each canister id but independent of the application logic installed to the canister.
Ref: https://internetcomputer.org/docs/current/developer-docs/smart-contracts/signatures/t-ecdsa/

### Our canister

This is a repo for our ICP canister:
https://github.com/zkemail/ic-dns-oracle/tree/main

Its basic features and constructions are described in README, and each public functions are documented in the source code.