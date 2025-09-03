// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

/// @title DKIMRegistry (Stub)
/// @notice PoC registry for DKIM public keys, keyed by domain. In PoC we rely on a trusted fetcher off-chain;
///         this contract exists for forward-compatibility and optional pinning.
contract DKIMRegistry is Ownable {
    // Key by domain hash to avoid expensive on-chain string operations.
    mapping(bytes32 => bytes) private _pubkeys;

    event DKIMKeySet(string indexed domain, bytes key);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @dev Callers should pass a normalized (lowercase) domain string off-chain.
    function setDKIMPublicKey(string calldata domain, bytes calldata key) external onlyOwner {
        require(bytes(domain).length > 0, "EMPTY_DOMAIN");
        bytes32 dh = keccak256(abi.encodePacked(domain));
        _pubkeys[dh] = key;
        emit DKIMKeySet(domain, key);
    }

    function getDKIMPublicKey(string calldata domain) external view returns (bytes memory) {
        bytes32 dh = keccak256(abi.encodePacked(domain));
        return _pubkeys[dh];
    }
}
