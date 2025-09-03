// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

/// @notice Minimal wallet that allows the Core (owner) to execute calls.
contract Wallet is Ownable {
    constructor(address core) Ownable(core) {}

    function execute(address to, uint256 value, bytes calldata data) external onlyOwner returns (bytes memory) {
        (bool ok, bytes memory res) = to.call{value: value}(data);
        require(ok, "CALL_FAILED");
        return res;
    }
}
