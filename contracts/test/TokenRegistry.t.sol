// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {TokenRegistry} from "src/registry/TokenRegistry.sol";

contract TokenRegistryTest is Test {
    TokenRegistry reg;
    address owner = address(0xABCD);
    address token = address(0xBEEF);

    function setUp() public {
        reg = new TokenRegistry(owner);
    }

    function test_AddRemoveToken_Owner() public {
        vm.prank(owner);
        reg.addToken(token);
        assertTrue(callIsAllowed(token));

        vm.prank(owner);
        reg.removeToken(token);
        assertFalse(callIsAllowed(token));
    }

    function test_RevertWhen_AddToken_NotOwner() public {
        vm.expectRevert();
        reg.addToken(token);
    }

    function test_RevertWhen_RemoveToken_NotOwner() public {
        vm.prank(owner);
        reg.addToken(token);
        vm.expectRevert();
        reg.removeToken(token);
    }

    function callIsAllowed(address t) internal view returns (bool ok) {
        (bool s, bytes memory r) = address(reg).staticcall(abi.encodeWithSelector(reg.isAllowed.selector, t));
        require(s, "isAllowed call failed");
        ok = abi.decode(r, (bool));
    }
}
