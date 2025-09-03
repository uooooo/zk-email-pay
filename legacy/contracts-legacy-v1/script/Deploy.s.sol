// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {TokenRegistry} from "src/registry/TokenRegistry.sol";
import {PriceOracle} from "src/oracle/PriceOracle.sol";
import {DKIMRegistry} from "src/dkim/DKIMRegistry.sol";
import {UnclaimsHandler} from "src/handlers/UnclaimsHandler.sol";
import {EmailWalletCore} from "src/core/EmailWalletCore.sol";
import {MockEmailSenderVerifier} from "src/verifiers/mocks/MockEmailSenderVerifier.sol";
import {MockClaimVerifier} from "src/verifiers/mocks/MockClaimVerifier.sol";

contract Deploy is Script {
    function run() external {
        address deployer = vm.rememberKey(vm.envUint("PRIVATE_KEY"));
        vm.startBroadcast(deployer);

        TokenRegistry tokenRegistry = new TokenRegistry(deployer);
        PriceOracle priceOracle = new PriceOracle(deployer, 0); // default 0, update via owner later
        DKIMRegistry dkimRegistry = new DKIMRegistry(deployer);

        // For local (anvil 31337) also deploy mocks and handlers/core
        uint256 chainId = block.chainid;
        address emailSenderVerifier = address(0);
        address claimVerifier = address(0);
        address unclaimsHandler = address(0);
        address core = address(0);
        if (chainId == 31337) {
            MockEmailSenderVerifier m1 = new MockEmailSenderVerifier(true);
            MockClaimVerifier m2 = new MockClaimVerifier(true);
            emailSenderVerifier = address(m1);
            claimVerifier = address(m2);
            UnclaimsHandler h = new UnclaimsHandler(deployer, tokenRegistry, m2);
            unclaimsHandler = address(h);
            EmailWalletCore c = new EmailWalletCore(deployer, tokenRegistry, priceOracle, m1, m2, h);
            core = address(c);
        }

        vm.stopBroadcast();

        // Serialize and write addresses JSON
        string memory obj = "deploy";
        string memory json = vm.serializeAddress(obj, "TokenRegistry", address(tokenRegistry));
        json = vm.serializeAddress(obj, "PriceOracle", address(priceOracle));
        json = vm.serializeAddress(obj, "DKIMRegistry", address(dkimRegistry));
        if (emailSenderVerifier != address(0)) {
            json = vm.serializeAddress(obj, "MockEmailSenderVerifier", emailSenderVerifier);
        }
        if (claimVerifier != address(0)) {
            json = vm.serializeAddress(obj, "MockClaimVerifier", claimVerifier);
        }
        if (unclaimsHandler != address(0)) {
            json = vm.serializeAddress(obj, "UnclaimsHandler", unclaimsHandler);
        }
        if (core != address(0)) {
            json = vm.serializeAddress(obj, "EmailWalletCore", core);
        }

        // Default output path for Base Sepolia (relative to contracts project root)
        string memory network = chainId == 31337 ? "local" : chainId == 84532 ? "base-sepolia" : "unknown";
        string memory outPath = string(abi.encodePacked("addresses/", network, ".json"));
        vm.writeJson(json, outPath);

        // Log to console as well
        console2.log("Network chainId:", chainId);
        console2.log("TokenRegistry:", address(tokenRegistry));
        console2.log("PriceOracle:", address(priceOracle));
        console2.log("DKIMRegistry:", address(dkimRegistry));
        if (core != address(0)) {
            console2.log("EmailWalletCore:", core);
            console2.log("UnclaimsHandler:", unclaimsHandler);
            console2.log("MockEmailSenderVerifier:", emailSenderVerifier);
            console2.log("MockClaimVerifier:", claimVerifier);
        }
        console2.log("Wrote addresses to:", outPath);
    }
}
