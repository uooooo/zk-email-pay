# DKIM Registry Signature Format Mismatch — Analysis and Fix

This documents and fixes the mismatch between the contract’s expected signature message and the IC DKIM Oracle’s produced signature.

Problem
- Contract (ECDSAOwnedDKIMRegistry) expected a message including `selector`:
  - `SET:selector=<s>;domain=<d>;public_key_hash=<0xHex>;`
- Oracle signs without `selector`:
  - `SET:domain=<d>;public_key_hash=<0xHex>;`
- Result: `Invalid signature` revert on `setDKIMPublicKeyHash`.

What changed (repo)
- Contract: `email-wallet/packages/contracts/src/utils/ECDSAOwnedDKIMRegistry.sol`
  - Accepts both formats now. It verifies signature against legacy (with selector) and oracle (without selector) message forms and accepts if either recovers to the configured signer.
  - Kept ABI intact (same function names/args). No relayer ABI change required.
  - Concrete changes (excerpts):

    - setDKIMPublicKeyHash: removed strict selector requirement and routed verification through `_verifySig`.

    ```solidity
    function setDKIMPublicKeyHash(
        string memory selector,
        string memory domainName,
        bytes32 publicKeyHash,
        bytes memory signature
    ) public {
        require(bytes(domainName).length != 0, "Invalid domain name");
        require(publicKeyHash != bytes32(0), "Invalid public key hash");
        require(isDKIMPublicKeyHashValid(domainName, publicKeyHash) == false, "publicKeyHash is already set");
        require(dkimRegistry.revokedDKIMPublicKeyHashes(publicKeyHash) == false, "publicKeyHash is revoked");

        // Accept both legacy (with selector) and oracle (without selector) formats
        require(
            _verifySig(SET_PREFIX, selector, domainName, publicKeyHash, signature),
            "Invalid signature"
        );

        dkimRegistry.setDKIMPublicKeyHash(domainName, publicKeyHash);
    }
    ```

    - revokeDKIMPublicKeyHash: same dual-format verification path.

    ```solidity
    function revokeDKIMPublicKeyHash(
        string memory selector,
        string memory domainName,
        bytes32 publicKeyHash,
        bytes memory signature
    ) public {
        require(bytes(domainName).length != 0, "Invalid domain name");
        require(publicKeyHash != bytes32(0), "Invalid public key hash");
        require(isDKIMPublicKeyHashValid(domainName, publicKeyHash) == true, "publicKeyHash is not set");
        require(dkimRegistry.revokedDKIMPublicKeyHashes(publicKeyHash) == false, "publicKeyHash is already revoked");

        // Accept both legacy (with selector) and oracle (without selector) formats
        require(
            _verifySig(REVOKE_PREFIX, selector, domainName, publicKeyHash, signature),
            "Invalid signature"
        );

        dkimRegistry.revokeDKIMPublicKeyHash(publicKeyHash);
    }
    ```

    - Added computeSignedMsgV2: builds oracle-format message (no selector).

    ```solidity
    function computeSignedMsgV2(
        string memory prefix,
        string memory domainName,
        bytes32 publicKeyHash
    ) public pure returns (string memory) {
        return string.concat(
            prefix,
            "domain=",
            domainName,
            ";public_key_hash=",
            uint256(publicKeyHash).toHexString(),
            ";"
        );
    }
    ```

    - Added _verifySig: tries legacy and oracle formats.

    ```solidity
    function _verifySig(
        string memory prefix,
        string memory selector,
        string memory domainName,
        bytes32 publicKeyHash,
        bytes memory signature
    ) internal view returns (bool) {
        // Legacy format (with selector)
        string memory msg1 = computeSignedMsg(prefix, selector, domainName, publicKeyHash);
        bytes32 digest1 = bytes(msg1).toEthSignedMessageHash();
        address rec1 = digest1.recover(signature);
        if (rec1 == signer) return true;

        // Oracle format (without selector)
        string memory msg2 = computeSignedMsgV2(prefix, domainName, publicKeyHash);
        bytes32 digest2 = bytes(msg2).toEthSignedMessageHash();
        address rec2 = digest2.recover(signature);
        return rec2 == signer;
    }
    ```
- Relayer: `email-wallet/packages/relayer/src/chain.rs`
  - `set_dkim_public_key_hash` now resolves the current default DKIM registry address from AccountHandler on each call, then invokes that registry. This avoids stale addresses in long-running relayer processes if the default registry is updated on-chain after relayer startup.
  - Concrete change (excerpt):

    ```rust
    pub async fn set_dkim_public_key_hash(
        &self,
        selector: String,
        domain_name: String,
        public_key_hash: [u8; 32],
        signature: Bytes,
    ) -> Result<String> {
        // Always resolve the current default registry from AccountHandler
        let current_registry_addr = self.account_handler.default_dkim_registry().call().await?;
        let registry = ECDSAOwnedDKIMRegistry::new(current_registry_addr, self.client.clone());
        let call = registry.set_dkim_public_key_hash(selector, domain_name, public_key_hash, signature);
        let tx = call.send().await?;
        let receipt = tx.log().confirmations(CONFIRMATIONS).await?.ok_or(anyhow!("No receipt"))?;
        let tx_hash = format!("0x{}", hex::encode(receipt.transaction_hash.as_bytes()));
        Ok(tx_hash)
    }
    ```

Deploy/migrate steps
1) Deploy updated `ECDSAOwnedDKIMRegistry` to Base Sepolia
   - Pass the signer address that matches the Oracle signer EOA (`get_signer_ethereum_address()` from the Oracle).
2) Update AccountHandler’s default DKIM registry to the newly deployed Registry address
   - Use your admin script or owner function to set the default registry. If you can only set per-account, call `updateDKIMRegistryOfAccountSalt` for accounts involved in tests.
3) Restart relayer (optional)
   - Not strictly required due to dynamic address lookup, but recommended after on-chain admin ops.

Validation steps
- Trigger `createAccount` again via relayer flow (invite → Gmail reply).
- Relayer `check_and_update_dkim` should fetch signature from the Oracle and submit it; Registry accepts (either format), no `Invalid signature`.
- Confirm on Base Sepolia explorer and email confirmations.

Notes
- Selector parsing remains in the relayer for other flows; the Registry no longer strictly requires it for signature verification.
- We did not add a relayer “local signer bypass”; production remains on the Oracle trust path.
- If you later change the default DKIM registry, the relayer picks up the new address automatically for subsequent calls, thanks to the dynamic lookup.

Troubleshooting
- If you still get `Invalid signature` after redeploying the Registry:
  - Ensure the Registry’s `signer` equals the Oracle’s EOA.
  - Ensure the Oracle message format is exactly `SET:domain=<d>;public_key_hash=<0xHex>;` (trailing `;` and 0x prefix matter). The Registry computes both forms internally.
  - Verify AccountHandler points to the new Registry address you deployed.
- `No DKIM-Signature header` in relayer logs is a separate content issue with the inbound email; the intake fallback reports a helpful error and skips. Use a DKIM-signed Gmail reply to proceed.
