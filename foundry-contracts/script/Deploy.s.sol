// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/GEOXRewards.sol";

contract DeployGEOXRewards is Script {
    // GEOX Token on Base Mainnet
    address constant GEOX_TOKEN = 0x7B2823592942a18246499C41a0E31Ec7c0057c68;
    
    // Admin signer wallet
    address constant SIGNER = 0x702AA27b8498EB3F9Ec0431BC5Fd258Bc19faf36;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        GEOXRewards rewards = new GEOXRewards(GEOX_TOKEN, SIGNER);
        
        console.log("GEOXRewards deployed at:", address(rewards));
        console.log("GEOX Token:", GEOX_TOKEN);
        console.log("Signer:", SIGNER);
        
        vm.stopBroadcast();
    }
}
