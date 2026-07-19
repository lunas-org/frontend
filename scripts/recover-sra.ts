// Read-only recovery preview for stuck SRA funds. Does NOT move anything — it just asks ZeroDev
// (a) what deposits are sitting at each SRA, and (b) the exact calls that would withdraw them and
// who they'd go to (`receiver`). From that we decide how to actually execute the withdrawal.
//
// Run from a native Windows terminal (WSL esbuild is the wrong platform):
//   pnpm tsx scripts/recover-sra.ts
//
// See context/zerodev-sra.md — two stuck test payments:
//   - 0.5 USDC on BNB Chain at SRA 0x727F476F7e046646e2d156784dc431367905E5D8
//   - ~0.000769 ETH on Arbitrum at SRA 0x3523148c50392eE51285d91263fC9212AB3e9775

import {
  getSmartRoutingAddressStatus,
  getWithdrawTokensCalls,
  SMART_ROUTING_ADDRESS_SERVER_URL,
} from "@zerodev/smart-routing-address";
import { zeroAddress } from "viem";

const PROJECT_ID = process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID ?? "43625a12-dac1-47d6-8ce4-7affb03f4dff";
const baseUrl = `${SMART_ROUTING_ADDRESS_SERVER_URL}/${PROJECT_ID}`;

// Stuck funds: which SRA, on which chain, which token.
const STUCK = [
  {
    label: "ETH stuck on Arbitrum",
    sra: "0x3523148c50392eE51285d91263fC9212AB3e9775" as const,
    tokens: [
      { chainId: 42161, token: zeroAddress }, // native ETH
      { chainId: 42161, token: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1" as const }, // WETH, in case it's held wrapped
    ],
  },
  {
    label: "USDC stuck on BNB Chain",
    sra: "0x727F476F7e046646e2d156784dc431367905E5D8" as const,
    tokens: [{ chainId: 56, token: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d" as const }],
  },
];

async function main() {
  console.log(`Project ${PROJECT_ID}\n`);

  for (const entry of STUCK) {
    console.log(`\n═══ ${entry.label} — SRA ${entry.sra} ═══`);

    try {
      const status = await getSmartRoutingAddressStatus({ smartRoutingAddress: entry.sra, config: { baseUrl } });
      console.log("Deposits seen by ZeroDev:", JSON.stringify(status, null, 2));
    } catch (err) {
      console.log("status error:", err instanceof Error ? err.message : String(err));
    }

    try {
      const withdraw = await getWithdrawTokensCalls({
        smartRoutingAddress: entry.sra,
        tokens: entry.tokens,
        config: { baseUrl },
      });
      console.log("Withdraw receiver (funds go here):", withdraw.receiver);
      console.log(
        "Withdraw calls:",
        JSON.stringify(withdraw.data, (_k, v) => (typeof v === "bigint" ? v.toString() : v), 2)
      );
    } catch (err) {
      console.log("withdraw-calls error:", err instanceof Error ? err.message : String(err));
    }
  }
}

main();
