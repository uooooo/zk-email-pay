// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IClaimVerifier {
    function verify(bytes calldata proof, bytes calldata publicInputs) external view returns (bool ok);
}
