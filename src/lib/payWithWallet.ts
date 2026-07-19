"use client";

// Buyer-side "pay with connected wallet" — sends USDC directly to an order's Smart Routing
// Address using an injected EIP-1193 wallet (MetaMask/Rabbit/etc browser extension), so a buyer
// on a desktop doesn't have to scan the QR with a phone or hand-copy the address + amount into
// their wallet. The site fills the amount; the buyer just confirms in their extension.
//
// This is a source-chain USDC transfer to the SRA address on whatever chain the wallet is
// currently on — the SRA then routes/settles it on Arbitrum exactly like a scanned payment. No
// ZeroDev SDK needed here (keeps the buyer bundle light + login-free); it's a plain ERC20
// transfer that the SRA picks up.

import { encodeFunctionData, parseUnits } from "viem";
import { erc20Abi } from "./erc20Abi";

// Native USDC per supported source chain (chainId -> token address), taken from
// @zerodev/smart-routing-address's TOKEN_ADDRESSES (verified against the installed SDK, not
// guessed). Only chains our SRA advertises as USDC sources belong here.
const USDC_BY_CHAIN: Record<number, `0x${string}`> = {
  1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // Ethereum
  10: "0x0b2c639c533813f4aa9d7837caf62653d097ff85", // Optimism
  56: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // BNB Smart Chain
  137: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359", // Polygon
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base
  42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Arbitrum One
};

const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum",
  10: "Optimism",
  56: "BNB Chain",
  137: "Polygon",
  8453: "Base",
  42161: "Arbitrum",
};

export const SUPPORTED_CHAIN_NAMES = Object.values(CHAIN_NAMES).join(", ");

// Broad label map (includes chains we DON'T support) so an "unsupported chain" error can name
// exactly what the wallet is on, instead of leaving the buyer guessing.
const CHAIN_LABELS: Record<number, string> = {
  1: "Ethereum",
  10: "Optimism",
  56: "BNB Chain",
  100: "Gnosis",
  137: "Polygon",
  8453: "Base",
  42161: "Arbitrum",
  43114: "Avalanche",
  59144: "Linea",
  534352: "Scroll",
};

export function chainLabel(chainId: number): string {
  return CHAIN_LABELS[chainId] ?? `chain ${chainId}`;
}

type Eip1193 = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

export function getInjectedWallet(): Eip1193 | null {
  if (typeof window === "undefined") return null;
  const eth = (window as unknown as { ethereum?: Eip1193 }).ethereum;
  return eth ?? null;
}

// Buyer-facing error. `detectedChainId` is set on chain-mismatch cases so the UI can name the
// network the wallet is actually on.
export class PayWithWalletError extends Error {
  detectedChainId?: number;
  constructor(code: string, detectedChainId?: number) {
    super(code);
    this.detectedChainId = detectedChainId;
  }
}

async function currentChainId(wallet: Eip1193): Promise<number> {
  const hex = (await wallet.request({ method: "eth_chainId" })) as string;
  return Number(hex);
}

/**
 * Sends `usdcAmount` (a human string like "2" or "1.50") of USDC to `sraAddress` from the
 * connected wallet, on whichever supported chain the wallet is currently on. Returns the source
 * tx hash. Throws PayWithWalletError with a buyer-friendly message for the cases worth
 * surfacing (no wallet, unsupported chain).
 */
export async function payWithWallet({
  sraAddress,
  usdcAmount,
}: {
  sraAddress: `0x${string}`;
  usdcAmount: string;
}): Promise<`0x${string}`> {
  const wallet = getInjectedWallet();
  if (!wallet) throw new PayWithWalletError("no-wallet");

  const accounts = (await wallet.request({ method: "eth_requestAccounts" })) as string[];
  const from = accounts?.[0];
  if (!from) throw new PayWithWalletError("no-account");

  const chainId = await currentChainId(wallet);
  console.info("[payWithWallet] connected wallet chainId:", chainId, chainLabel(chainId));
  const usdc = USDC_BY_CHAIN[chainId];
  if (!usdc) throw new PayWithWalletError("unsupported-chain", chainId);

  const amount = parseUnits(usdcAmount, 6); // USDC has 6 decimals
  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
    args: [sraAddress, amount],
  });

  const txHash = (await wallet.request({
    method: "eth_sendTransaction",
    params: [{ from, to: usdc, data }],
  })) as `0x${string}`;

  return txHash;
}
