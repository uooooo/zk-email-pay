// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PriceOracle} from "src/oracle/PriceOracle.sol";

contract PriceOracleTest is Test {
    PriceOracle oracle;
    address owner = address(0xCAFE);

    function setUp() public {
        oracle = new PriceOracle(owner, 0);
    }

    function test_SetGetFeePerGas_Owner() public {
        vm.prank(owner);
        oracle.setFeePerGas(123);
        assertEq(oracle.getFeePerGas(), 123);
    }

    function test_RevertWhen_SetFeePerGas_NotOwner() public {
        vm.expectRevert();
        oracle.setFeePerGas(1);
    }
}
