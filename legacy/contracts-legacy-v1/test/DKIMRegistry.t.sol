// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {DKIMRegistry} from "src/dkim/DKIMRegistry.sol";

contract DKIMRegistryTest is Test {
    DKIMRegistry reg;
    address owner = address(0xD00D);

    function setUp() public {
        reg = new DKIMRegistry(owner);
    }

    function test_SetGetKey_Owner() public {
        string memory domain = "example.com";
        bytes memory key = hex"1234";
        vm.prank(owner);
        reg.setDKIMPublicKey(domain, key);
        bytes memory got = reg.getDKIMPublicKey(domain);
        assertEq(keccak256(got), keccak256(key));
    }

    function test_RevertWhen_SetKey_NotOwner() public {
        vm.expectRevert();
        reg.setDKIMPublicKey("example.com", hex"01");
    }
}
