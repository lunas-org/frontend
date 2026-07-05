"use client";

// "Buat Produk" — CLAUDE.md §9 screen 3. Creates a Smart Routing Address whose action calls
// fulfillOrder(orderId, merchant, FLEX.AMOUNT) on Checkout.sol, forwarding to the logged-in
// merchant's own wallet. On success, saves the product+order and goes to the product detail
// page (screen 4) rather than showing the result inline.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { arbitrum } from "viem/chains";
import { isLoggedIn, getMagicProvider } from "@/lib/magic";
import { createSmartAccountFromProvider, createProductPaymentAddress, generateOrderId } from "@/lib/zerodev";
import { saveProduct, saveOrder } from "@/lib/store";
import { CalmLoader } from "@/components/CalmLoader";

type Status = "checking" | "form" | "creating" | "error";

export default function NewProductPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState<string | null>(null);
  const [merchant, setMerchant] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [priceUsd, setPriceUsd] = useState("");

  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    (async () => {
      const loggedIn = await isLoggedIn();
      if (!loggedIn) {
        router.replace("/login");
        return;
      }
      const provider = getMagicProvider();
      const { address } = await createSmartAccountFromProvider(provider);
      setMerchant(address);
      setStatus("form");
    })();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!merchant) return;

    const checkoutAddress = process.env.NEXT_PUBLIC_CHECKOUT_CONTRACT_ADDRESS_MAINNET as
      | `0x${string}`
      | undefined;
    if (!checkoutAddress) {
      setError(
        "Checkout.sol belum di-deploy ke Arbitrum One (mainnet). SRA butuh alamat kontrak mainnet yang nyata — deploy dulu, lalu isi NEXT_PUBLIC_CHECKOUT_CONTRACT_ADDRESS_MAINNET."
      );
      setStatus("error");
      return;
    }

    setStatus("creating");
    setError(null);

    try {
      const orderId = generateOrderId();
      const sraAddress = await createProductPaymentAddress({
        orderId,
        merchant: merchant as `0x${string}`,
        checkoutAddress,
      });

      const productId = crypto.randomUUID();
      saveProduct({
        id: productId,
        merchant: merchant as `0x${string}`,
        title,
        priceUsd,
        createdAt: Date.now(),
      });
      saveOrder({
        id: orderId,
        productId,
        sraAddress,
        checkoutAddress,
        chainId: arbitrum.id,
        status: "pending",
        createdAt: Date.now(),
      });

      router.push(`/products/${productId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  if (status === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p className="text-muted">Memuat...</p>
      </main>
    );
  }

  if (status === "creating") {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <CalmLoader label="Membuat link bayar..." />
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-5 pt-6">
        <Link href="/dashboard" className="text-sm text-muted">
          ← Kembali
        </Link>
      </header>

      <main className="flex flex-1 flex-col justify-center px-5">
        <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-sm flex-col gap-5">
          <h1 className="font-display text-2xl font-semibold text-ink">Buat produk</h1>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted" htmlFor="title">
              Nama produk
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-2xl border border-line px-4 py-3 text-ink"
              placeholder="Preset Lightroom"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted" htmlFor="price">
              Harga (USD)
            </label>
            <input
              id="price"
              value={priceUsd}
              onChange={(e) => setPriceUsd(e.target.value)}
              required
              type="number"
              min="0"
              step="0.01"
              className="w-full rounded-2xl border border-line px-4 py-3 text-ink"
              placeholder="5"
            />
          </div>

          {status === "error" && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="mt-2 w-full rounded-2xl bg-primary px-6 py-4 font-medium text-paper"
          >
            Buat link bayar
          </button>
        </form>
      </main>
    </div>
  );
}
