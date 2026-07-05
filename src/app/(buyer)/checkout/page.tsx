"use client";

// Buyer checkout — CLAUDE.md §9 screens 5–7 (Checkout, Processing, Success). No login required.
// Reads product/order data from the URL (no Supabase yet — see src/lib/store.ts's comment on
// why the buyer's browser can't read the merchant's local store). Polls Checkout.sol's `paid`
// mapping directly on-chain so the status flips to "Lunas ✓" automatically, no refresh needed —
// CLAUDE.md calls this the most-critical-to-be-smooth part of the whole product.

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { createPublicClient, http } from "viem";
import { arbitrum, arbitrumSepolia } from "viem/chains";
import { motion, AnimatePresence } from "framer-motion";
import { checkoutAbi } from "@/lib/checkoutAbi";

const POLL_INTERVAL_MS = 4000;

function chainById(chainId: number) {
  return chainId === arbitrum.id ? arbitrum : arbitrumSepolia;
}

function SuccessCheck() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="flex h-20 w-20 items-center justify-center rounded-full bg-success"
    >
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <motion.path
          d="M4 12.5L9.5 18L20 6"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
        />
      </svg>
    </motion.div>
  );
}

function CheckoutContent() {
  const params = useSearchParams();
  const title = params.get("title");
  const priceUsd = params.get("price");
  const address = params.get("address");
  const orderId = params.get("orderId") as `0x${string}` | null;
  const checkoutAddress = params.get("checkoutAddress") as `0x${string}` | null;
  const chainId = params.get("chainId");

  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!orderId || !checkoutAddress || !chainId) return;

    const client = createPublicClient({
      chain: chainById(Number(chainId)),
      transport: http(),
    });

    let cancelled = false;

    async function poll() {
      try {
        const isPaid = await client.readContract({
          address: checkoutAddress!,
          abi: checkoutAbi,
          functionName: "paid",
          args: [orderId!],
        });
        if (!cancelled && isPaid) setPaid(true);
      } catch {
        // transient RPC errors are fine — just retry on the next tick
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [orderId, checkoutAddress, chainId]);

  if (!title || !priceUsd || !address) {
    return <p className="text-sm text-muted">Link pembayaran tidak valid.</p>;
  }

  return (
    <AnimatePresence mode="wait">
      {paid ? (
        <motion.div
          key="success"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <SuccessCheck />
          <p className="font-display text-2xl font-semibold text-success">Lunas ✓</p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full max-w-sm rounded-2xl bg-white p-5 text-left shadow-sm"
          >
            <p className="text-sm text-muted">Struk</p>
            <p className="mt-1 text-lg font-medium text-ink">{title}</p>
            <p className="font-display text-2xl font-semibold tabular-nums text-ink">
              ${priceUsd}
            </p>
            <p className="mt-1 text-xs text-muted">{new Date().toLocaleString("id-ID")}</p>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="pending"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center gap-4"
        >
          <p className="text-lg font-medium text-ink">{title}</p>
          <p className="font-display text-5xl font-semibold tabular-nums text-ink">${priceUsd}</p>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <QRCodeSVG value={address} size={220} />
          </div>
          <p className="text-sm text-muted">Bayar dari mana saja</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function CheckoutPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <Suspense fallback={<p className="text-muted">Memuat...</p>}>
        <CheckoutContent />
      </Suspense>
    </main>
  );
}
