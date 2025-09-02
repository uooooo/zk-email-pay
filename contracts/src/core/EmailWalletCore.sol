// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {UnclaimsHandler} from "src/handlers/UnclaimsHandler.sol";
import {TokenRegistry} from "src/registry/TokenRegistry.sol";
import {PriceOracle} from "src/oracle/PriceOracle.sol";
import {IEmailSenderVerifier} from "src/verifiers/IEmailSenderVerifier.sol";
import {IClaimVerifier} from "src/verifiers/IClaimVerifier.sol";

/// @notice Minimal Core that orchestrates calls to UnclaimsHandler for MVP tests.
contract EmailWalletCore is Ownable {
    TokenRegistry public tokenRegistry;
    PriceOracle public priceOracle;
    IEmailSenderVerifier public emailSenderVerifier;
    IClaimVerifier public claimVerifier;
    UnclaimsHandler public unclaims;

    constructor(
        address initialOwner,
        TokenRegistry _registry,
        PriceOracle _priceOracle,
        IEmailSenderVerifier _emailSenderVerifier,
        IClaimVerifier _claimVerifier,
        UnclaimsHandler _unclaims
    ) Ownable(initialOwner) {
        tokenRegistry = _registry;
        priceOracle = _priceOracle;
        emailSenderVerifier = _emailSenderVerifier;
        claimVerifier = _claimVerifier;
        unclaims = _unclaims;
    }

    function setUnclaims(UnclaimsHandler u) external onlyOwner {
        unclaims = u;
    }

    function setClaimVerifier(IClaimVerifier v) external onlyOwner {
        claimVerifier = v;
    }

    function setEmailSenderVerifier(IEmailSenderVerifier v) external onlyOwner {
        emailSenderVerifier = v;
    }

    // Proxy helpers (owner acts as relayer in MVP tests)
    function createUnclaimed(
        address token,
        uint256 amount,
        uint64 expiry,
        bytes32 emailCommit,
        uint96 nonce,
        address funder
    ) external onlyOwner returns (uint256 id) {
        id = unclaims.createUnclaimed(token, amount, expiry, emailCommit, nonce, funder);
    }

    function cancelUnclaimed(uint256 id) external onlyOwner {
        unclaims.cancelUnclaimed(id);
    }

    function claimUnclaimed(
        uint256 id,
        address recipient,
        uint256 feeAmount,
        bytes calldata proof,
        bytes calldata publicInputs
    ) external onlyOwner {
        unclaims.claimUnclaimed(id, recipient, feeAmount, proof, publicInputs);
    }
}
