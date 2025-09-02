## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy (Base Sepolia)

Requires environment variable `PRIVATE_KEY` loaded with the deployer key (PoC: hotkey). Set `RPC_URL` in your environment or pass `--rpc-url`.

```shell
$ export PRIVATE_KEY=0x...
$ forge script script/Deploy.s.sol \
    --rpc-url $RPC_URL \
    --broadcast \
    --verify --verifier etherscan --verifier-url https://api-sepolia.basescan.org/api
```

On success, addresses are written to `contracts/addresses/base-sepolia.json` and printed to the console.

Contracts deployed by the script:
- `TokenRegistry` (Ownable)
- `PriceOracle` (fixed fee-per-gas, Ownable)
- `DKIMRegistry` (stub, Ownable)

See also:
- Engineering plan: `../docs/engineering/zk-email-pay/plans/contracts.md`
- Base compatibility: `../docs/engineering/zk-email-pay/research/base-compatibility.md`

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
