// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IClaimVerifier} from "src/verifiers/IClaimVerifier.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {TokenRegistry} from "src/registry/TokenRegistry.sol";

contract UnclaimsHandler is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Unclaimed {
        address token;
        uint256 amount;
        uint64 expiry;
        bytes32 emailCommit;
        uint96 nonce;
        bool used;
        address funder;
    }

    event UnclaimedCreated(
        uint256 indexed id,
        address indexed sender,
        address indexed token,
        uint256 amount,
        uint64 expiry,
        bytes32 emailCommit,
        uint96 nonce
    );
    event UnclaimedCancelled(uint256 indexed id);
    event UnclaimedClaimed(uint256 indexed id, address indexed recipient, uint256 feeAmount);

    uint256 public nextId;
    mapping(uint256 => Unclaimed) public unclaimedById;

    TokenRegistry public immutable tokenRegistry;
    IClaimVerifier public claimVerifier;

    constructor(address initialOwner, TokenRegistry registry, IClaimVerifier verifier) Ownable(initialOwner) {
        tokenRegistry = registry;
        claimVerifier = verifier;
    }

    function setClaimVerifier(IClaimVerifier v) external onlyOwner {
        claimVerifier = v;
    }

    function createUnclaimed(
        address token,
        uint256 amount,
        uint64 expiry,
        bytes32 emailCommit,
        uint96 nonce,
        address funder
    ) external onlyOwner nonReentrant returns (uint256 id) {
        require(tokenRegistry.isAllowed(token), "TOKEN_NOT_ALLOWED");
        require(amount > 0, "AMOUNT_ZERO");
        require(funder != address(0), "FUNDER_ZERO");
        // Pull funds into escrow (this handler contract)
        IERC20(token).safeTransferFrom(funder, address(this), amount);
        id = ++nextId;
        unclaimedById[id] = Unclaimed({
            token: token,
            amount: amount,
            expiry: expiry,
            emailCommit: emailCommit,
            nonce: nonce,
            used: false,
            funder: funder
        });
        emit UnclaimedCreated(id, msg.sender, token, amount, expiry, emailCommit, nonce);
    }

    function cancelUnclaimed(uint256 id) external onlyOwner nonReentrant {
        Unclaimed storage u = unclaimedById[id];
        require(u.amount > 0, "NOT_FOUND");
        require(!u.used, "ALREADY_USED");
        require(block.timestamp > u.expiry, "NOT_EXPIRED");
        // Effects first, then interactions
        u.used = true; // mark consumed to prevent reentrancy double-spend
        // Refund to original funder
        IERC20(u.token).safeTransfer(u.funder, u.amount);
        emit UnclaimedCancelled(id);
    }

    function claimUnclaimed(
        uint256 id,
        address recipient,
        uint256 feeAmount,
        bytes calldata proof,
        bytes calldata publicInputs
    ) external onlyOwner nonReentrant {
        Unclaimed storage u = unclaimedById[id];
        require(u.amount > 0, "NOT_FOUND");
        require(!u.used, "ALREADY_USED");
        require(block.timestamp <= u.expiry, "EXPIRED");
        require(claimVerifier.verify(proof, publicInputs), "PROOF_INVALID");
        require(recipient != address(0), "RECIP_ZERO");
        require(feeAmount <= u.amount, "FEE_TOO_HIGH");
        uint256 payout = u.amount - feeAmount;
        // Effects first
        u.used = true;
        IERC20 token = IERC20(u.token);
        // Interactions
        if (payout > 0) token.safeTransfer(recipient, payout);
        if (feeAmount > 0) token.safeTransfer(owner(), feeAmount);
        emit UnclaimedClaimed(id, recipient, feeAmount);
    }
}
