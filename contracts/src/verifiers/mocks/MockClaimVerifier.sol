// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IClaimVerifier} from "src/verifiers/IClaimVerifier.sol";

contract MockClaimVerifier is IClaimVerifier {
    bool public result;

    constructor(bool initial) {
        result = initial;
    }

    function setResult(bool v) external {
        result = v;
    }

    function verify(bytes calldata, bytes calldata) external view returns (bool ok) {
        ok = result;
    }
}
