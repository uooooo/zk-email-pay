// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {TokenRegistry} from "src/registry/TokenRegistry.sol";
import {PriceOracle} from "src/oracle/PriceOracle.sol";
import {DKIMRegistry} from "src/dkim/DKIMRegistry.sol";
import {UnclaimsHandler} from "src/handlers/UnclaimsHandler.sol";
import {EmailWalletCore} from "src/core/EmailWalletCore.sol";
import {MockClaimVerifier} from "src/verifiers/mocks/MockClaimVerifier.sol";
import {MockEmailSenderVerifier} from "src/verifiers/mocks/MockEmailSenderVerifier.sol";

contract UnclaimsFlowTest is Test {
    address owner = address(0xA11CE);
    address token = address(0xBEEF); // dummy token address; registry-only

    TokenRegistry reg;
    PriceOracle oracle;
    DKIMRegistry dkim;
    MockClaimVerifier claimV;
    MockEmailSenderVerifier senderV;
    UnclaimsHandler handler;
    EmailWalletCore core;

    function setUp() public {
        reg = new TokenRegistry(owner);
        oracle = new PriceOracle(owner, 0);
        dkim = new DKIMRegistry(owner);
        claimV = new MockClaimVerifier(true);
        senderV = new MockEmailSenderVerifier(true);
        handler = new UnclaimsHandler(owner, reg, claimV);
        core = new EmailWalletCore(owner, reg, oracle, senderV, claimV, handler);
        // Hand over handler control to Core so Core can call onlyOwner functions
        vm.prank(owner);
        handler.transferOwnership(address(core));

        // allow token in registry
        vm.prank(owner);
        reg.addToken(token);
    }

    function test_CreateAndClaim_Succeeds() public {
        bytes32 emailCommit = keccak256("user@example.com|salt");
        uint64 expiry = uint64(block.timestamp + 1 days);

        vm.startPrank(owner);
        uint256 id = core.createUnclaimed(token, 100, expiry, emailCommit);
        // claim with mock verifier
        core.claimUnclaimed(id, hex"", hex"");
        vm.stopPrank();

        (,,,, bool used) = handler.unclaimedById(id);
        assertTrue(used, "should be marked used after claim");
    }

    function test_CancelAfterExpiry_Succeeds() public {
        bytes32 emailCommit = keccak256("user@example.com|salt");
        uint64 expiry = uint64(block.timestamp + 1);
        vm.startPrank(owner);
        uint256 id = core.createUnclaimed(token, 1, expiry, emailCommit);
        vm.warp(block.timestamp + 2);
        core.cancelUnclaimed(id);
        vm.stopPrank();

        (,,,, bool used) = handler.unclaimedById(id);
        assertTrue(used, "should be marked used after cancel");
    }

    function test_RevertWhen_ClaimExpired() public {
        bytes32 emailCommit = keccak256("user@example.com|salt");
        uint64 expiry = uint64(block.timestamp + 1);
        vm.startPrank(owner);
        uint256 id = core.createUnclaimed(token, 1, expiry, emailCommit);
        vm.warp(block.timestamp + 2);
        vm.expectRevert(bytes("EXPIRED"));
        core.claimUnclaimed(id, hex"", hex"");
        vm.stopPrank();
    }
}
