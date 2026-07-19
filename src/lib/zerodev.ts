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
  getWithdrawTokensCalls,
  FLEX,
  SMART_ROUTING_ADDRESS_SERVER_URL,
  SMART_ROUTING_ADDRESS_V0_2_1,
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

// Same Kernel smart account, but a client pinned to Arbitrum ONE (mainnet). The smart account
// address is deterministic across chains, so this is still the same 0x… the merchant sees — it
// just lets us send userOps on mainnet (where the stuck SRA funds actually are). The ZeroDev
// mainnet RPC/bundler/paymaster URL is the same shape as the testnet one with chain 42161.
function getZeroDevMainnetRpc() {
  return `https://rpc.zerodev.app/api/v3/${getZeroDevProjectId()}/chain/42161`;
}

export async function createMainnetKernelClient(provider: EIP1193Provider) {
  const rpc = getZeroDevMainnetRpc();
  const publicClient = createPublicClient({ chain: arbitrum, transport: http(rpc) });

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
    chain: arbitrum,
    bundlerTransport: http(rpc),
    client: publicClient,
    paymaster: true, // sponsored gas — the smart account needs no ETH of its own to withdraw
  });

  return { account, kernelClient, address: account.address };
}

/**
 * Recovers tokens stuck at a Smart Routing Address, executed by the SRA's owner (the merchant's
 * smart account — the only address the SRA's withdraw() authorizes, verified on-chain). Asks
 * ZeroDev for the withdraw calls, then sends them as one sponsored userOp on Arbitrum. Returns the
 * userOp hash. `tokens` are `{ chainId, token }` where token is the zero address for native ETH.
 */
export async function recoverStuckTokens({
  provider,
  sraAddress,
  tokens,
}: {
  provider: EIP1193Provider;
  sraAddress: `0x${string}`;
  tokens: { chainId: number; token: `0x${string}` }[];
}) {
  const { account, kernelClient } = await createMainnetKernelClient(provider);

  const withdraw = await getWithdrawTokensCalls({
    smartRoutingAddress: sraAddress,
    tokens,
    config: { baseUrl: `${SMART_ROUTING_ADDRESS_SERVER_URL}/${getZeroDevProjectId()}` },
  });

  const arbCalls = withdraw.data.find((d) => d.chainId === arbitrum.id)?.calls ?? [];
  if (arbCalls.length === 0) throw new Error("No Arbitrum withdraw calls returned for this SRA/token.");

  const calls = arbCalls.map((c) => ({
    to: c.to as `0x${string}`,
    value: BigInt(c.value ?? 0),
    data: c.data as `0x${string}`,
  }));

  const userOpHash = await kernelClient.sendUserOperation({
    callData: await account.encodeCalls(calls),
  });
  await kernelClient.waitForUserOperationReceipt({ hash: userOpHash });

  return { userOpHash, receiver: withdraw.receiver };
}

// Chains a buyer can pay FROM, per SRA's mainnet SUPPORTED_TOKENS (checked directly against the
// installed SDK, not guessed — see context/zerodev-sra.md). destChain is ALWAYS Arbitrum One
// here regardless of NEXT_PUBLIC_CHAIN, since SRA is confirmed working only on mainnet for our
// project.
//
// USDC-ONLY, on purpose. We tried also accepting NATIVE (ETH) as a source, but it's fundamentally
// incompatible with Checkout.sol: the SRA delivers whatever token the buyer sent (ETH stays ETH
// across the bridge — it does NOT auto-swap to USDC), while fulfillOrder does `usdc.safeTransfer`.
// So an ETH payment bridges to Arbitrum and then the action reverts (contract has no USDC),
// leaving the ETH stuck at the SRA address. Verified on-chain with a real $1.50 ETH test payment
// (2026-07-19): ETH bridged Base→Arbitrum fine but sat unconverted at the SRA. Accepting only
// USDC means the delivered asset always matches what fulfillOrder moves. Supporting other tokens
// later needs a swap-to-USDC step inside the SRA action (a DEX call before fulfillOrder), not just
// adding them to srcTokens.
const USDC_SRC_CHAINS = [mainnet, optimism, base, arbitrum, polygon, bsc];

function getZeroDevProjectId() {
  const id = process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID;
  if (!id) throw new Error("NEXT_PUBLIC_ZERODEV_PROJECT_ID is not set");
  return id;
}

/**
 * Creates a Smart Routing Address for one order: a buyer can pay USDC from any of the chains
 * above, and it lands as USDC on Arbitrum One, then the SRA executes a two-call action that
 * forwards the payment to `merchant` and marks `orderId` paid.
 *
 * The action is TWO calls, run atomically by the SRA (which holds the delivered USDC):
 *   1. USDC.transfer(checkoutAddress, FLEX.AMOUNT) — hand the delivered USDC to Checkout.sol
 *   2. fulfillOrder(orderId, merchant, FLEX.AMOUNT) — Checkout forwards it to the merchant + records
 * Both are needed: without call (1) the contract has no USDC to forward and call (2) reverts —
 * that was the v1 bug that stranded a real payment at the SRA (see context/zerodev-sra.md).
 *
 * `FLEX.AMOUNT` is patched with the actual delivered amount at execution time; `FLEX.TOKEN_ADDRESS`
 * is patched with the delivered token's address (USDC on Arbitrum) — so we never hardcode either.
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
  const transferToContract = createCall({
    target: FLEX.TOKEN_ADDRESS, // = delivered USDC address on Arbitrum, patched by the SRA
    value: 0n,
    abi: erc20Abi,
    functionName: "transfer",
    args: [checkoutAddress, FLEX.AMOUNT],
  });

  const fulfill = createCall({
    target: checkoutAddress,
    value: 0n,
    abi: checkoutAbi,
    functionName: "fulfillOrder",
    args: [orderId, merchant, FLEX.AMOUNT],
  });

  const { smartRoutingAddress } = await createSmartRoutingAddress({
    owner: merchant,
    destChain: arbitrum,
    srcTokens: USDC_SRC_CHAINS.map((chain) => ({ tokenType: "USDC" as const, chain })),
    actions: {
      USDC: { action: [transferToContract, fulfill], fallBack: [] },
    },
    // We advertise USDC from several chains so a buyer can pay "from anywhere". With the SDK
    // default (allowPartialRoutes:false) the whole request fails if ANY one of those has no live
    // route at creation time — which is exactly the "Failed to create smart routing address"
    // error we hit (the confirmed-working hello-sra baseline only ever used ONE source token, so
    // never tripped this). true = create the address anyway and just drop the currently-unroutable
    // sources, which matches the product intent: pay from whatever's available, don't hard-fail.
    allowPartialRoutes: true,
    config: {
      baseUrl: `${SMART_ROUTING_ADDRESS_SERVER_URL}/${getZeroDevProjectId()}`,
      // `version` lives under `config` per the SDK's actual type (CreateSmartRoutingAddressParams
      // ->config.version) — NOT top-level. scripts/hello-sra.ts passes it top-level, which
      // TypeScript itself rejects (confirmed via `tsc --noEmit`) and which the JS implementation
      // silently ignores (it only destructures `config` from the params, not a sibling
      // `version`) — so that "working" test never actually threaded a version through either.
      // Nesting it correctly here is a real correctness fix, not just a guess.
      version: SMART_ROUTING_ADDRESS_V0_2_1,
    },
  });

  return smartRoutingAddress;
}

/** Merchant's settled balance = their own USDC balance on Arbitrum One, since Checkout.sol
 * forwards funds to the merchant's wallet the instant an order is fulfilled (CLAUDE.md §8:
 * "Payment truth = on-chain"). Hardcoded to `arbitrum` (mainnet) — deliberately NOT the `chain`
 * module var above, same reasoning as `createProductPaymentAddress`'s `destChain`: SRA only
 * settles on Arbitrum One regardless of NEXT_PUBLIC_CHAIN, so reading the balance anywhere else
 * would silently show $0 forever even after a real payment lands there. Needs its own
 * NEXT_PUBLIC_USDC_ADDRESS_MAINNET (not the shared NEXT_PUBLIC_USDC_ADDRESS, which is the
 * testnet USDC address per .env.local.example) for the same reason. Returns a human-readable
 * string like "1240.50" (USDC has 6 decimals), or null if that env var isn't configured. */
export async function getUsdcBalance(address: `0x${string}`): Promise<string | null> {
  const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS_MAINNET as `0x${string}` | undefined;
  if (!usdcAddress) return null;

  const publicClient = createPublicClient({ chain: arbitrum, transport: http() });
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
