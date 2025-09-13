# Upstream Contracts Overview — email-wallet/packages/contracts（v2）

目的
- 本プロジェクト（v2）が採用する upstream（email-wallet）のコントラクト群について、関係する主要ファイルと設計・コードの要点（文法的な観点含む）を短時間で把握できるようにまとめます。

参照元
- email-wallet/packages/contracts
- デプロイスクリプト/ブロードキャスト: `script/*.s.sol`, `broadcast/DefaultSetupScript.s.sol/<chainId>/`

---

## 全体像（何がデプロイされるか）
- Core: `src/EmailWalletCore.sol`
- Handlers: `src/handlers/*`（RelayerHandler / AccountHandler / UnclaimsHandler / ExtensionHandler）
- Registries/Utils: `src/utils/*`（TokenRegistry / ECDSAOwnedDKIMRegistry / UniswapTWAPOracle etc.）
- Wallet: `src/Wallet.sol`
- Verifiers: `AllVerifiers`（または個別）を用意するスクリプト群
- デプロイスクリプト: `script/DefaultSetupScript.s.sol` ほか（`RegisterRelayer.s.sol` など）

本プロジェクトではラッパーで upstream スクリプトを直接実行し、addresses/ に JSON を出力します。

---

## 主要ファイルと要点

### 1) EmailWalletCore.sol（`src/EmailWalletCore.sol`）
- 役割: Email Wallet の中核。ハンドラとレジストリ/オラクル/検証器を参照し、メール由来の操作をハンドラへ連携。
- 文法/設計の要点:
  - Upgradeable パターン: `@openzeppelin/contracts-upgradeable` 系の `Initializable`, `OwnableUpgradeable`, `UUPSUpgradeable` を継承。
  - 典型コード:
    ```solidity
    import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
    import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
    import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

    contract EmailWalletCore is Initializable, OwnableUpgradeable, UUPSUpgradeable {
        function initialize(/* params */) public initializer {
            __Ownable_init();
            // 初期化ロジック
        }
        function _authorizeUpgrade(address newImpl) internal override onlyOwner {}
    }
    ```
  - 初期化子（initializer）と `_authorizeUpgrade` の実装に注意（UUPS で必須）。

### 2) Handlers（`src/handlers/*.sol`）
- RelayerHandler: リレイヤー設定の登録/更新（メール/ホスト名/手数料等の on-chain 設定）。リレイヤーはデプロイ後にここへ登録。
- AccountHandler: アカウント作成/初期化/移送（回路/検証と連動）。
- UnclaimsHandler: Unclaimed（未受領）状態の作成/取消/消費。受取フローの基盤。
- ExtensionHandler: 拡張機能の管理（NFT/Uniswap 等のテンプレ/拡張呼び出し）。
- 文法/設計の要点:
  - 多くが `Initializable`, `OwnableUpgradeable`, `UUPSUpgradeable` を採用。プロキシ経由の upgrade を前提。
  - OZ のユーティリティ: `SafeERC20`, `Address`, `Strings` 等を利用。
  - `CREATE2`（`Create2Upgradeable`）でデターミニスティックなデプロイを扱う箇所あり。

### 3) Registries / Utils（`src/utils/*.sol`）
- TokenRegistry: 送金可能トークンの Allowlist。`OwnableUpgradeable` のみで単純な登録/解除。
- ECDSAOwnedDKIMRegistry: DKIM 公開鍵を ECDSA 所有アカウントが設定するレジストリ（将来の強化オプション）。
- UniswapTWAPOracle: 手数料/レート参照のための TWAP オラクル（上流の拡張で利用）。
- 文法ポイント:
  - `import "@openzeppelin/..."` の `@` 付きパスは monorepo 直下の `node_modules` に解決されます（Yarn Workspaces）。

### 4) Wallet.sol（`src/Wallet.sol`）
- 役割: UUPS Upgradeable な各ユーザー Wallet 実装。
- 文法/設計の要点:
  - Upgradeable + ERC1967 Proxy 経由で配備。
  - Token 受領/実行のためのフック/インタフェース実装あり。

### 5) デプロイスクリプト（`script/*.s.sol`）
- `DefaultSetupScript.s.sol:Deploy`: TokenRegistry → Verifiers → DKIMRegistry → Wallet → Handlers → Core の順で一括セットアップ。
- `RegisterRelayer.s.sol`: RelayerHandler にリレイヤー情報を登録。
- 文法の要点（Foundry Script）:
  - `import "forge-std/Script.sol";` を使い、`vm` 経由でブロードキャスト/環境参照。
  - 実行は `forge script <Script:Func> --rpc-url ... --chain-id ... --broadcast`。

---

## Import 解決（なぜ node_modules が必要か）
- 上流は Yarn Workspaces を使い、`packages/contracts` から `../../node_modules` を参照します。
- 本プロジェクトのラッパーは `email-wallet/` 直下でパッケージをインストールし、Foundry の import を解決させています。

---

## addresses の生成と登録フロー
- デプロイ実行で `broadcast/DefaultSetupScript.s.sol/<chainId>/run-*.json` が生成されます。
- `scripts/deploy/export-addresses.sh` が JSON から `CREATE` 取引を抽出し `{ ContractName: Address }` を作成 → `addresses/<network>.json` に保存。
- Relayer は `RegisterRelayer.s.sol` で on-chain 登録（`scripts/deploy/register-relayer.sh` の呼び出し）。

---

## よく見る Upgradeable 文法（抜粋）
- 初期化関数:
  ```solidity
  function initialize(/* params */) public initializer {
      __Ownable_init();
      // ...
  }
  ```
- UUPS の権限付与:
  ```solidity
  function _authorizeUpgrade(address newImpl) internal override onlyOwner {}
  ```
- プロキシ（ERC1967）
  ```solidity
  import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
  ```
- 安全なトークン転送:
  ```solidity
  import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
  import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
  using SafeERC20 for IERC20;
  ```

---

## 本プロジェクトでの使い方（v2）
- Deploy: `scripts/deploy/email-wallet-local.sh`（上流スクリプトを直接実行）
- Export addresses: `scripts/deploy/export-addresses.sh` → `addresses/<network>.json`
- Relayer: `RegisterRelayer.s.sol` を wrapper から実行し on-chain 登録
- Prover/Relayer サービス: Hono（TS）で最小 API を提供しつつ、上流のセマンティクス（API/テンプレ/回路）に合わせる

---

## 補足（テスト）
- `scripts/test/email-wallet-contracts.sh`: 上流の unit/integration テストを呼び出し。
- Integration は circuits/FFI が必要（上流の README に従ってセットアップ）。

以上を押さえておけば、上流の更新にも追従しやすく、こちらでは UX とアダプタに集中できます。
