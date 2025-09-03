// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IEmailSenderVerifier {
    function verify(bytes calldata proof, bytes calldata publicInputs) external view returns (bool ok);
}
