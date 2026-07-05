// "Hello SRA" diagnostic — see CLAUDE.md §10 (Week 1 milestone) and
// context/hackathon-requirements.md's open questions.
//
// Purpose: empirically test whether ZeroDev's Smart Routing Address supports
// Arbitrum Sepolia (testnet) as a destination chain, or only Arbitrum One (mainnet).
// This costs nothing — createSmartRoutingAddress just registers an address, no funds
// need to move for this test.
//
// v2: the first run mixed a MAINNET source chain (Ethereum) with a TESTNET destination
// chain (Arbitrum Sepolia), which ZeroDev support (Chase Allred, Offchain Labs) says isn't
// how it works — SRA is free on testnet, but source and destination need to be on the same
// "side" (testnet-to-testnet, or mainnet-to-mainnet). This version tests matched pairs.
//
// Run: pnpm hello-sra

import {
  createSmartRoutingAddress,
  createCall,
  SMART_ROUTING_ADDRESS_SERVER_URL,
  SMART_ROUTING_ADDRESS_V0_2_1,
} from "@zerodev/smart-routing-address";
import { arbitrum, arbitrumSepolia, mainnet, sepolia, baseSepolia } from "viem/chains";
import { erc20Abi, type Chain } from "viem";

const PROJECT_ID = process.env.ZERODEV_PROJECT_ID ?? "43625a12-dac1-47d6-8ce4-7affb03f4dff";

// Well-known public address (vitalik.eth), used only as a placeholder "owner" —
// no funds of ours ever touch it, this is just to satisfy the API's address param.
const OWNER = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as const;

// Real Arbitrum One USDC address per CLAUDE.md §0.
const ARBITRUM_ONE_USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" as const;
// Arbitrum Sepolia testnet USDC — found via @zerodev/smart-routing-address's own exported
// SUPPORTED_TOKENS_TESTNET constant (chain 421614), not guessed.
const ARBITRUM_SEPOLIA_USDC = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d" as const;

async function tryCombo(label: string, destChain: Chain, srcChain: Chain, usdcOnDest: `0x${string}`) {
  try {
    const call = createCall({
      target: usdcOnDest,
      value: 0n,
      abi: erc20Abi,
      functionName: "transfer",
      args: [OWNER, 0n],
    });

    const { smartRoutingAddress } = await createSmartRoutingAddress({
      owner: OWNER,
      destChain,
      srcTokens: [{ tokenType: "NATIVE", chain: srcChain }],
      actions: {
        NATIVE: { action: [call], fallBack: [] },
      },
      version: SMART_ROUTING_ADDRESS_V0_2_1,
      config: {
        baseUrl: `${SMART_ROUTING_ADDRESS_SERVER_URL}/${PROJECT_ID}`,
      },
    });

    console.log(`✅ ${label}: SUPPORTED — smartRoutingAddress = ${smartRoutingAddress}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const extra = err && typeof err === "object" ? JSON.stringify(err, Object.getOwnPropertyNames(err)) : "";
    console.log(`❌ ${label}: FAILED — ${message}`);
    if (extra && extra !== "{}") console.log(`   details: ${extra}`);
  }
}

async function main() {
  console.log(`Using ZeroDev project ${PROJECT_ID}\n`);

  console.log("-- Matched testnet-to-testnet, explicit version v0.2.1 --");
  await tryCombo("Sepolia -> Arbitrum Sepolia", arbitrumSepolia, sepolia, ARBITRUM_SEPOLIA_USDC);
  await tryCombo("Base Sepolia -> Arbitrum Sepolia", arbitrumSepolia, baseSepolia, ARBITRUM_SEPOLIA_USDC);
  await tryCombo("Arbitrum Sepolia -> Arbitrum Sepolia (same chain)", arbitrumSepolia, arbitrumSepolia, ARBITRUM_SEPOLIA_USDC);

  console.log("\n-- Baseline: matched mainnet-to-mainnet (already confirmed working) --");
  await tryCombo("Ethereum -> Arbitrum One", arbitrum, mainnet, ARBITRUM_ONE_USDC);
}

main();
