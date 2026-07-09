// Display helpers.
//
// Buyers in the target market (Indonesia, +62 / Rp copy) think in rupiah, not USDC. We show a
// local-currency *estimate* alongside the USDC amount so a non-crypto buyer instantly grasps the
// price. USDC is dollar-pegged, so this is really USD→IDR. The rate is pinned (no live FX feed
// yet) and clearly labelled "≈" so it reads as an estimate, never a quoted settlement figure.
// When a live rate source lands, replace USD_TO_IDR with a fetched value.

export const USD_TO_IDR = 16300;

/** "≈ Rp 407.500" for a USDC string like "25.00", or null if the amount isn't a positive number. */
export function idrEstimate(usdcAmount: string | number): string | null {
  const usd = typeof usdcAmount === "number" ? usdcAmount : parseFloat(usdcAmount);
  if (!(usd > 0)) return null;
  const idr = Math.round(usd * USD_TO_IDR);
  return `≈ ${new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(idr)}`;
}

/** Rp 25000 -> 1.53 (USD/USDC). Same pinned rate as idrEstimate, just inverted, so a merchant
 * can price a product in rupiah and it's stored as the USDC amount the SRA/contract actually use. */
export function usdFromIdr(idrAmount: number): number {
  return idrAmount / USD_TO_IDR;
}
