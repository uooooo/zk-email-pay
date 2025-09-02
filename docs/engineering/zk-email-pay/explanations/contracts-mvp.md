# Contracts MVP Explained

目的
- zk-email-pay の初期 3 契約（TokenRegistry/PriceOracle/DKIMRegistry Stub）が何をするか、Solidity の文法要素、テスト観点、合否基準をまとめたメモ。

対象ファイル
- TokenRegistry: `contracts/src/registry/TokenRegistry.sol`
- PriceOracle: `contracts/src/oracle/PriceOracle.sol`
- DKIMRegistry (Stub): `contracts/src/dkim/DKIMRegistry.sol`
- Deploy Script: `contracts/script/Deploy.s.sol`
- Tests: `contracts/test/*.t.sol`

---

## TokenRegistry
- 目的: zk-email-pay で送金対象にできる ERC20 トークンの許可リスト（allowlist）。
- 機能:
  - `addToken(address token)` / `removeToken(address token)`: オーナーのみ実行可能（Ownable）。
  - `isAllowed(address token) -> bool`: 認可済みかを返す。
  - `TokenAdded`, `TokenRemoved` イベントを発火。
- 文法ポイント:
  - `import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";` で OZ の Ownable を使用。
  - `constructor(address initialOwner) Ownable(initialOwner) {}` で初期オーナーを設定。
  - `mapping(address => bool) private _allowed;` でアドレス→bool の許可状態を保持。
  - `onlyOwner` モディファイアでアクセス制御。

## PriceOracle（固定）
- 目的: MVP 用の「ガス単価（wei/gas）」の固定オラクル。将来的に OP Stack Gas Price Oracle 等へ差し替え可能。
- 機能:
  - `setFeePerGas(uint256)`（オーナーのみ）で値を更新。
  - `getFeePerGas()` で現在値を参照。
  - 変更時に `FeePerGasUpdated` を発火。
- 文法ポイント:
  - `uint256 private _feePerGasWei;` のストレージ変数。
  - コンストラクタ引数に初期値（0）を受け取り、イベント発火。

## DKIMRegistry（Stub）
- 目的: DKIM 公開鍵のピン/将来互換のための最小レジストリ。PoC では Relayer の Trusted Fetcher を主とし、ここはオプション。
- 機能:
  - `setDKIMPublicKey(string domain, bytes key)`（オーナーのみ）: ドメイン文字列（lowercase 正規化前提）に対応する鍵を保存。
  - `getDKIMPublicKey(string domain) -> bytes`: 保存済み鍵を取得。
  - `DKIMKeySet` イベントを発火。
- 文法ポイント:
  - `mapping(bytes32 => bytes)` とし、`keccak256(abi.encodePacked(domain))` をキーにすることで文字列のコスト/比較を最小化。

## Deploy Script
- 目的: 3 契約を Base Sepolia 等に一括デプロイし、アドレス JSON を `contracts/addresses/base-sepolia.json` に出力。
- 重要ポイント:
  - `vm.envUint("PRIVATE_KEY")` から秘密鍵を取得し、`vm.rememberKey`/`vm.startBroadcast` でブロードキャストを開始。
  - `vm.serializeAddress` と `vm.writeJson` で JSON 出力。
  - Foundry のファイル書込は許可制。`contracts/foundry.toml` の `fs_permissions` で `./addresses/` への write を許可済み。

---

## テスト（forge-std）
- フレームワーク: `forge-std/Test.sol` を使用。
- 代表的ユーティリティ:
  - `vm.prank(addr)`: 次の 1 トランザクションのみ `msg.sender` を `addr` に偽装。
  - `vm.expectRevert()`: 直後の呼び出しが revert することを期待。
  - `assertEq`, `assertTrue`, `assertFalse`: 値検証。
- 観点:
  - TokenRegistry: オーナーのみ add/remove でき、isAllowed が正しい。
  - PriceOracle: オーナーのみ set でき、get が反映される。
  - DKIMRegistry: オーナーのみ set でき、get が一致する。
- 合格基準（OK の定義）:
  - `forge test` が全て PASS。
  - オーナー以外の更新系呼び出しが revert する（`vm.expectRevert` で検証）。

---

## 実行方法（ローカル）
```sh
cd contracts
forge build
forge test -vvv
# anvil 起動後にスクリプト（ドライラン）
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545
# 実ブロードキャスト例（Base Sepolia）
export PRIVATE_KEY=0x...
export RPC_URL=https://base-sepolia.g.alchemy.com/v2/...
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast \
  --verify --verifier etherscan --verifier-url https://api-sepolia.basescan.org/api
```

---

## 参考
- 設計/計画: `docs/engineering/zk-email-pay/plans/contracts.md`
- Base 互換性: `docs/engineering/zk-email-pay/research/base-compatibility.md`
- Foundry fs_permissions: `contracts/foundry.toml`
- OpenZeppelin Ownable（Context7/MCP 参照）
