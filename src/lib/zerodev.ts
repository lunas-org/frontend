"use client";

// ZeroDev integration — Kernel smart account creation from a Magic signer.
// See context/zerodev-setup.md, context/zerodev-sra.md, context/zerodev-arbitrum.md.
//
// The signer/validator/account/client shape below was confirmed by reading the installed
// @zerodev/sdk and @zerodev/ecdsa-validator type definitions directly (not guessed):
// - Signer type = OneOf<EIP1193Provider | WalletClient | LocalAccount | SmartAccount>, and
//   Magic's `magic.rpcProvider` (see src/lib/magic.ts) is a plain EIP1193Provider — passed
//   directly, no ethers wrapping needed.
// - Kernel version pinned to KERNEL_V3_3 per context/zerodev-arbitrum.md's Arbitrum guidance.

import { http, createPublicClient, type EIP1193Provider } from "viem";
import { arbitrum, arbitrumSepolia, mainnet, optimism, base, polygon, bsc } from "viem/chains";
import { entryPoint07Address } from "viem/account-abstraction";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { createKernelAccount, createKernelAccountClient } from "@zerodev/sdk";
import { KERNEL_V3_3 } from "@zerodev/sdk/constants";
import {
  createSmartRoutingAddress,
  createCall,
  FLEX,
  SMART_ROUTING_ADDRESS_SERVER_URL,
} from "@zerodev/smart-routing-address";
import { checkoutAbi } from "./checkoutAbi";
import { erc20Abi } from "./erc20Abi";

const chain = process.env.NEXT_PUBLIC_CHAIN === "arbitrum" ? arbitrum : arbitrumSepolia;
const entryPoint = { address: entryPoint07Address, version: "0.7" as const };
const kernelVersion = KERNEL_V3_3;

function getZeroDevRpc() {
  const rpc = process.env.NEXT_PUBLIC_ZERODEV_RPC;
  if (!rpc) throw new Error("NEXT_PUBLIC_ZERODEV_RPC is not set");
  return rpc;
}

export async function createSmartAccountFromProvider(provider: EIP1193Provider) {
  const publicClient = createPublicClient({
    chain,
    transport: http(getZeroDevRpc()),
  });

  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    signer: provider,
    entryPoint,
    kernelVersion,
  });

  const account = await createKernelAccount(publicClient, {
    plugins: { sudo: ecdsaValidator },
    entryPoint,
    kernelVersion,
  });

  const kernelClient = createKernelAccountClient({
    account,
    chain,
    bundlerTransport: http(getZeroDevRpc()),
    client: publicClient,
    paymaster: true,
  });

  return { account, kernelClient, address: account.address };
}

// Chains a buyer can pay FROM, per SRA's mainnet SUPPORTED_TOKENS (checked directly against the
// installed SDK, not guessed — see context/zerodev-sra.md). destChain is ALWAYS Arbitrum One
// here regardless of NEXT_PUBLIC_CHAIN, since SRA is confirmed working only on mainnet for our
// project (testnet investigation still open, see context/zerodev-sra.md).
const NATIVE_SRC_CHAINS = [mainnet, optimism, base, arbitrum];
const USDC_SRC_CHAINS = [mainnet, optimism, base, arbitrum, polygon, bsc];

function getZeroDevProjectId() {
  const id = process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID;
  if (!id) throw new Error("NEXT_PUBLIC_ZERODEV_PROJECT_ID is not set");
  return id;
}

/**
 * Creates a Smart Routing Address for one order: a buyer can pay from any of the chains/tokens
 * above, and it always lands as USDC on Arbitrum One, triggering Checkout.sol.fulfillOrder —
 * which forwards the payment to `merchant` and marks `orderId` paid.
 *
 * `FLEX.AMOUNT` in the call args is a SRA placeholder that gets patched in with whatever amount
 * actually arrives at execution time — we don't need to know the exact USDC amount in advance.
 * See context/zerodev-sra.md's "how a variable deposit amount reaches the action call" section.
 */
export async function createProductPaymentAddress({
  orderId,
  merchant,
  checkoutAddress,
}: {
  orderId: `0x${string}`;
  merchant: `0x${string}`;
  checkoutAddress: `0x${string}`;
}) {
  const call = createCall({
    target: checkoutAddress,
    value: 0n,
    abi: checkoutAbi,
    functionName: "fulfillOrder",
    args: [orderId, merchant, FLEX.AMOUNT],
  });

  const { smartRoutingAddress } = await createSmartRoutingAddress({
    owner: merchant,
    destChain: arbitrum,
    srcTokens: [
      ...NATIVE_SRC_CHAINS.map((chain) => ({ tokenType: "NATIVE" as const, chain })),
      ...USDC_SRC_CHAINS.map((chain) => ({ tokenType: "USDC" as const, chain })),
    ],
    actions: {
      NATIVE: { action: [call], fallBack: [] },
      USDC: { action: [call], fallBack: [] },
    },
    config: {
      baseUrl: `${SMART_ROUTING_ADDRESS_SERVER_URL}/${getZeroDevProjectId()}`,
    },
  });

  return smartRoutingAddress;
}

/** Merchant's settled balance = their own USDC balance on Arbitrum One, since Checkout.sol
 * forwards funds to the merchant's wallet the instant an order is fulfilled (CLAUDE.md §8:
 * "Payment truth = on-chain"). Returns a human-readable string like "1240.50" (USDC has 6
 * decimals), or null if NEXT_PUBLIC_USDC_ADDRESS isn't configured. */
export async function getUsdcBalance(address: `0x${string}`): Promise<string | null> {
  const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}` | undefined;
  if (!usdcAddress) return null;

  const publicClient = createPublicClient({ chain, transport: http() });
  const raw = await publicClient.readContract({
    address: usdcAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address],
  });
  return (Number(raw) / 1e6).toFixed(2);
}

export function generateOrderId(): `0x${string}` {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}` as `0x${string}`;
}
