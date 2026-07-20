import { arbitrum, arbitrumSepolia } from "viem/chains";

// Block explorer base URLs, keyed by chain ID — used for the merchant-facing "View on Arbiscan"
// link on a settled order. This is the one place in the merchant UI where a raw transaction hash
// is deliberately shown (settings' account address is the other) — it's proof/verification for
// a merchant who wants it, not something surfaced in the buyer-facing checkout flow, which stays
// jargon-free per CLAUDE.md's North Star.
const EXPLORER_BASE: Record<number, string> = {
  [arbitrum.id]: "https://arbiscan.io",
  [arbitrumSepolia.id]: "https://sepolia.arbiscan.io",
};

export function explorerTxUrl(chainId: number, txHash: string): string | null {
  const base = EXPLORER_BASE[chainId];
  return base ? `${base}/tx/${txHash}` : null;
}
