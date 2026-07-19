// SRA creation diagnostic — reproduces the EXACT createProductPaymentAddress() call
// (src/lib/zerodev.ts) against our real mainnet Checkout contract, to isolate why the in-app
// "Create payment link" fails with "Failed to create smart routing address".
//
// Run from a native Windows terminal (WSL's esbuild binary is the wrong platform):
//   pnpm tsx scripts/diagnose-sra.ts
//
// Tests, in order:
//   1. Our exact multi-chain call WITH allowPartialRoutes:true  (the applied fix)
//   2. Our exact multi-chain call WITHOUT it                    (reproduces the failure)
//   3. Each source chain alone, to see which ones actually have a live route right now

import {
  createSmartRoutingAddress,
  createCall,
  FLEX,
  SMART_ROUTING_ADDRESS_SERVER_URL,
} from "@zerodev/smart-routing-address";
import { arbitrum, mainnet, optimism, base, polygon, bsc } from "viem/chains";
import { type Chain } from "viem";

const PROJECT_ID = process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID ?? "43625a12-dac1-47d6-8ce4-7affb03f4dff";

// Real deployed mainnet Checkout contract (context/deployments.md).
const CHECKOUT = "0x309Da073796E6Bd75135174EB7EC3Fb5E4c21282" as const;
// Placeholder owner/merchant — just needs to be a valid address for this test.
const OWNER = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as const;

const checkoutAbi = [
  {
    type: "function",
    name: "fulfillOrder",
    inputs: [
      { name: "orderId", type: "bytes32" },
      { name: "merchant", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

const NATIVE_SRC_CHAINS = [mainnet, optimism, base, arbitrum];
const USDC_SRC_CHAINS = [mainnet, optimism, base, arbitrum, polygon, bsc];

function buildCall() {
  const orderId = ("0x" + "11".repeat(32)) as `0x${string}`;
  return createCall({
    target: CHECKOUT,
    value: 0n,
    abi: checkoutAbi,
    functionName: "fulfillOrder",
    args: [orderId, OWNER, FLEX.AMOUNT],
  });
}

async function attempt(
  label: string,
  srcTokens: { tokenType: "NATIVE" | "USDC"; chain: Chain }[],
  allowPartialRoutes: boolean
) {
  const call = buildCall();
  const actions: Record<string, { action: ReturnType<typeof createCall>[]; fallBack: [] }> = {};
  if (srcTokens.some((t) => t.tokenType === "NATIVE")) actions.NATIVE = { action: [call], fallBack: [] };
  if (srcTokens.some((t) => t.tokenType === "USDC")) actions.USDC = { action: [call], fallBack: [] };

  try {
    const { smartRoutingAddress } = await createSmartRoutingAddress({
      owner: OWNER,
      destChain: arbitrum,
      srcTokens,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      actions: actions as any,
      allowPartialRoutes,
      config: { baseUrl: `${SMART_ROUTING_ADDRESS_SERVER_URL}/${PROJECT_ID}` },
    });
    console.log(`✅ ${label}: OK — ${smartRoutingAddress}`);
  } catch (err) {
    const detail =
      err && typeof err === "object" && "details" in err ? JSON.stringify((err as { details: unknown }).details) : "";
    console.log(`❌ ${label}: ${err instanceof Error ? err.message : String(err)}  ${detail}`);
  }
}

async function main() {
  console.log(`Project ${PROJECT_ID}, dest = Arbitrum One\n`);

  const allSrc = [
    ...NATIVE_SRC_CHAINS.map((chain) => ({ tokenType: "NATIVE" as const, chain })),
    ...USDC_SRC_CHAINS.map((chain) => ({ tokenType: "USDC" as const, chain })),
  ];

  console.log("-- Full multi-chain set (our real config) --");
  await attempt("all 10 sources, allowPartialRoutes:true", allSrc, true);
  await attempt("all 10 sources, allowPartialRoutes:false", allSrc, false);

  console.log("\n-- Each source alone (allowPartialRoutes:false), to see which have live routes --");
  for (const chain of NATIVE_SRC_CHAINS) {
    await attempt(`NATIVE @ ${chain.name}`, [{ tokenType: "NATIVE", chain }], false);
  }
  for (const chain of USDC_SRC_CHAINS) {
    await attempt(`USDC @ ${chain.name}`, [{ tokenType: "USDC", chain }], false);
  }
}

main();
