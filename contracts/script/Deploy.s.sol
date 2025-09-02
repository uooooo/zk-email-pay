// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {TokenRegistry} from "src/registry/TokenRegistry.sol";
import {PriceOracle} from "src/oracle/PriceOracle.sol";
import {DKIMRegistry} from "src/dkim/DKIMRegistry.sol";

contract Deploy is Script {
    function run() external {
        address deployer = vm.rememberKey(vm.envUint("PRIVATE_KEY"));
        vm.startBroadcast(deployer);

        TokenRegistry tokenRegistry = new TokenRegistry(deployer);
        PriceOracle priceOracle = new PriceOracle(deployer, 0); // default 0, update via owner later
        DKIMRegistry dkimRegistry = new DKIMRegistry(deployer);

        vm.stopBroadcast();

        // Serialize and write addresses JSON
        string memory obj = "deploy";
        string memory json = vm.serializeAddress(obj, "TokenRegistry", address(tokenRegistry));
        json = vm.serializeAddress(obj, "PriceOracle", address(priceOracle));
        json = vm.serializeAddress(obj, "DKIMRegistry", address(dkimRegistry));

        // Default output path for Base Sepolia (relative to contracts project root)
        string memory outPath = string(abi.encodePacked("addresses/", "base-sepolia.json"));
        vm.writeJson(json, outPath);

        // Log to console as well
        console2.log("TokenRegistry:", address(tokenRegistry));
        console2.log("PriceOracle:", address(priceOracle));
        console2.log("DKIMRegistry:", address(dkimRegistry));
        console2.log("Wrote addresses to:", outPath);
    }
}
