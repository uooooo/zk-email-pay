// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

/// @title TokenRegistry
/// @notice Minimal allowlist for ERC20 tokens usable by zk-email-pay.
contract TokenRegistry is Ownable {
    mapping(address => bool) private _allowed;

    event TokenAdded(address indexed token);
    event TokenRemoved(address indexed token);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function addToken(address token) external onlyOwner {
        require(token != address(0), "ZERO_ADDR");
        require(!_allowed[token], "ALREADY_ALLOWED");
        _allowed[token] = true;
        emit TokenAdded(token);
    }

    function removeToken(address token) external onlyOwner {
        require(_allowed[token], "NOT_ALLOWED");
        delete _allowed[token];
        emit TokenRemoved(token);
    }

    function isAllowed(address token) external view returns (bool) {
        return _allowed[token];
    }
}
