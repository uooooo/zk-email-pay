// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

/// @title PriceOracle (Fixed)
/// @notice Minimal fixed-fee oracle for MVP. Stores a single fee-per-gas value in wei.
contract PriceOracle is Ownable {
    uint256 private _feePerGasWei;

    event FeePerGasUpdated(uint256 newValue);

    constructor(address initialOwner, uint256 initialFeePerGasWei) Ownable(initialOwner) {
        _feePerGasWei = initialFeePerGasWei;
        emit FeePerGasUpdated(initialFeePerGasWei);
    }

    function setFeePerGas(uint256 weiPerGas) external onlyOwner {
        _feePerGasWei = weiPerGas;
        emit FeePerGasUpdated(weiPerGas);
    }

    function getFeePerGas() external view returns (uint256) {
        return _feePerGasWei;
    }
}
