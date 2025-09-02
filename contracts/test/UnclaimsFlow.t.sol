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
import {MockERC20} from "test/mocks/MockERC20.sol";

contract UnclaimsFlowTest is Test {
    address owner = address(0xA11CE);
    address token;
    MockERC20 tkn;

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

        // deploy mock token, mint to owner, add to registry, approve handler to pull
        tkn = new MockERC20("MockUSD", "mUSD", 18);
        token = address(tkn);
        vm.prank(owner);
        tkn.mint(owner, 1_000_000 ether);
        vm.prank(owner);
        reg.addToken(token);
        // approve handler to transferFrom funder (owner)
        vm.prank(owner);
        tkn.approve(address(handler), type(uint256).max);
    }

    function test_CreateAndClaim_Succeeds() public {
        bytes32 emailCommit = keccak256("user@example.com|salt");
        uint64 expiry = uint64(block.timestamp + 1 days);

        vm.startPrank(owner);
        uint256 ownerBefore = tkn.balanceOf(owner);
        uint256 handlerBefore = tkn.balanceOf(address(handler));
        address recipient = address(0xB0B);
        uint256 id = core.createUnclaimed(token, 100 ether, expiry, emailCommit, 1, owner);
        // After create: owner down 100, handler up 100
        assertEq(tkn.balanceOf(owner), ownerBefore - 100 ether, "owner debited on escrow");
        assertEq(tkn.balanceOf(address(handler)), handlerBefore + 100 ether, "handler credited on escrow");
        // claim with mock verifier (fee=0)
        core.claimUnclaimed(id, recipient, 0, hex"", hex"");
        vm.stopPrank();

        (address _t,uint256 _a,uint64 _e,bytes32 _c,uint96 _n,bool used,address _f) = handler.unclaimedById(id);
        assertTrue(used, "should be marked used after claim");
        // After claim: handler down 100, recipient up 100
        assertEq(tkn.balanceOf(address(handler)), handlerBefore, "handler escrow cleared");
        assertEq(tkn.balanceOf(recipient), 100 ether, "recipient received payout");
    }

    function test_CancelAfterExpiry_Succeeds() public {
        bytes32 emailCommit = keccak256("user@example.com|salt");
        uint64 expiry = uint64(block.timestamp + 1);
        vm.startPrank(owner);
        uint256 id = core.createUnclaimed(token, 1 ether, expiry, emailCommit, 2, owner);
        uint256 ownerMid = tkn.balanceOf(owner);
        uint256 handlerMid = tkn.balanceOf(address(handler));
        vm.warp(block.timestamp + 2);
        core.cancelUnclaimed(id);
        vm.stopPrank();

        (address _t,uint256 _a,uint64 _e,bytes32 _c,uint96 _n,bool used,address _f) = handler.unclaimedById(id);
        assertTrue(used, "should be marked used after cancel");
        // After cancel: handler down 1, owner refunded
        assertEq(tkn.balanceOf(address(handler)), handlerMid - 1 ether, "handler refunded out");
        assertEq(tkn.balanceOf(owner), ownerMid + 1 ether, "owner refunded");
    }

    function test_RevertWhen_ClaimExpired() public {
        bytes32 emailCommit = keccak256("user@example.com|salt");
        uint64 expiry = uint64(block.timestamp + 1);
        vm.startPrank(owner);
        uint256 id = core.createUnclaimed(token, 1 ether, expiry, emailCommit, 3, owner);
        vm.warp(block.timestamp + 2);
        vm.expectRevert(bytes("EXPIRED"));
        core.claimUnclaimed(id, address(0xB0B), 0, hex"", hex"");
        vm.stopPrank();
    }

    function test_RevertWhen_ClaimVerifierReturnsFalse() public {
        bytes32 emailCommit = keccak256("user@example.com|salt");
        uint64 expiry = uint64(block.timestamp + 1 days);
        vm.startPrank(owner);
        uint256 id = core.createUnclaimed(token, 100 ether, expiry, emailCommit, 4, owner);
        // flip mock to false
        claimV.setResult(false);
        vm.expectRevert(bytes("PROOF_INVALID"));
        core.claimUnclaimed(id, address(0xB0B), 0, hex"", hex"");
        vm.stopPrank();
    }

    function test_ClaimWithFee_DistributesCorrectly() public {
        bytes32 emailCommit = keccak256("user@example.com|salt");
        uint64 expiry = uint64(block.timestamp + 1 days);
        address recipient = address(0xB0B);
        uint256 amount = 50 ether;
        uint256 fee = 7 ether;
        vm.startPrank(owner);
        uint256 id = core.createUnclaimed(token, amount, expiry, emailCommit, 5, owner);
        uint256 handlerBefore = tkn.balanceOf(address(handler));
        uint256 recipientBefore = tkn.balanceOf(recipient);
        uint256 coreBefore = tkn.balanceOf(address(core));
        core.claimUnclaimed(id, recipient, fee, hex"", hex"");
        vm.stopPrank();
        assertEq(tkn.balanceOf(address(handler)), handlerBefore - amount, "escrow released");
        assertEq(tkn.balanceOf(recipient), recipientBefore + (amount - fee), "payout to recipient");
        assertEq(tkn.balanceOf(address(core)), coreBefore + fee, "fee to core(owner)");
    }
}
