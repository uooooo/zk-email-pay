// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {IClaimVerifier} from "src/verifiers/IClaimVerifier.sol";
import {TokenRegistry} from "src/registry/TokenRegistry.sol";

contract UnclaimsHandler is Ownable {
    struct Unclaimed {
        address token;
        uint256 amount;
        uint64 expiry;
        bytes32 emailCommit;
        uint96 nonce;
        bool used;
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
    event UnclaimedClaimed(uint256 indexed id);

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

    function createUnclaimed(address token, uint256 amount, uint64 expiry, bytes32 emailCommit, uint96 nonce)
        external
        onlyOwner
        returns (uint256 id)
    {
        require(tokenRegistry.isAllowed(token), "TOKEN_NOT_ALLOWED");
        require(amount > 0, "AMOUNT_ZERO");
        id = ++nextId;
        unclaimedById[id] = Unclaimed({
            token: token,
            amount: amount,
            expiry: expiry,
            emailCommit: emailCommit,
            nonce: nonce,
            used: false
        });
        emit UnclaimedCreated(id, msg.sender, token, amount, expiry, emailCommit, nonce);
    }

    function cancelUnclaimed(uint256 id) external onlyOwner {
        Unclaimed storage u = unclaimedById[id];
        require(u.amount > 0, "NOT_FOUND");
        require(!u.used, "ALREADY_USED");
        require(block.timestamp > u.expiry, "NOT_EXPIRED");
        u.used = true; // mark consumed to prevent later claim
        emit UnclaimedCancelled(id);
    }

    function claimUnclaimed(uint256 id, bytes calldata proof, bytes calldata publicInputs) external onlyOwner {
        Unclaimed storage u = unclaimedById[id];
        require(u.amount > 0, "NOT_FOUND");
        require(!u.used, "ALREADY_USED");
        require(block.timestamp <= u.expiry, "EXPIRED");
        require(claimVerifier.verify(proof, publicInputs), "PROOF_INVALID");
        u.used = true;
        emit UnclaimedClaimed(id);
    }
}
