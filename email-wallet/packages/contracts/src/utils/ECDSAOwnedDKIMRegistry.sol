// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@zk-email/contracts/DKIMRegistry.sol";

/// @title ECDSAOwnedDKIMRegistry
/// @notice A DKIM Registry that could be updated by predefined ECDSA signer
contract ECDSAOwnedDKIMRegistry is IDKIMRegistry {
    using Strings for *;
    using ECDSA for *;

    DKIMRegistry public dkimRegistry;
    address public signer;

    string public constant SET_PREFIX = "SET:";
    string public constant REVOKE_PREFIX = "REVOKE:";

    constructor(address _signer) {
        dkimRegistry = new DKIMRegistry();
        signer = _signer;
    }

    function isDKIMPublicKeyHashValid(string memory domainName, bytes32 publicKeyHash) public view returns (bool) {
        return dkimRegistry.isDKIMPublicKeyHashValid(domainName, publicKeyHash);
    }

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

    function computeSignedMsg(
        string memory prefix,
        string memory selector,
        string memory domainName,
        bytes32 publicKeyHash
    ) public view returns (string memory) {
        return
            string.concat(
                prefix,
                "selector=",
                selector,
                ";domain=",
                domainName,
                ";public_key_hash=",
                uint256(publicKeyHash).toHexString(),
                ";"
            );
    }

    /// @dev Oracle-format message (without selector)
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
}
