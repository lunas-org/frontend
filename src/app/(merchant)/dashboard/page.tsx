"use client";

// Merchant dashboard — CLAUDE.md §9 screen 2: Saldo, "+ Buat Produk", list of recent Pesanan
// with status pills. Saldo is still a mock ($0 — needs an on-chain balance read, not built yet).
// Pesanan list reads from the local store (see src/lib/store.ts) — stands in for Supabase.
// Mobile-first: primary action pinned to the thumb zone at the bottom of the screen.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isLoggedIn, getMagicProvider, logout } from "@/lib/magic";
import { createSmartAccountFromProvider } from "@/lib/zerodev";
import { listOrders, listProducts, type Order, type Product } from "@/lib/store";

type Status = "loading" | "error" | "ready";

export default function MerchantDashboardPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    (async () => {
      try {
        const loggedIn = await isLoggedIn();
        if (!loggedIn) {
          router.replace("/login");
          return;
        }
        // Not shown in the UI (no wallet talk per CLAUDE.md's North Star) — just needs to be
        // created so the account exists; the address itself is only used internally elsewhere.
        const provider = getMagicProvider();
        await createSmartAccountFromProvider(provider);
        setOrders(listOrders());
        setProducts(listProducts());
        setStatus("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      }
    })();
  }, [router]);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  function productTitle(productId: string) {
    return products.find((p) => p.id === productId)?.title ?? "Produk";
  }

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p className="text-muted">Memuat...</p>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center p-8 text-center">
        <p className="text-sm text-red-600">Gagal: {error}</p>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-5 pt-6">
        <p className="font-display text-lg font-semibold text-ink">Lunas</p>
        <button onClick={handleLogout} className="text-sm text-muted">
          Keluar
        </button>
      </header>

      <main className="flex flex-1 flex-col gap-8 px-5 pb-28 pt-8">
        <section className="text-center">
          <p className="text-sm text-muted">Saldo</p>
          <p className="font-display text-5xl font-semibold tabular-nums text-ink">$0</p>
        </section>

        <section className="mx-auto w-full max-w-md text-left">
          <p className="mb-3 text-sm text-muted">Pesanan</p>
          {orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line px-4 py-8 text-center">
              <p className="text-sm text-muted">Belum ada pesanan. Yuk buat produk pertamamu.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {orders.map((order) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between rounded-2xl border border-line bg-paper px-4 py-3"
                >
                  <span className="text-sm text-ink">{productTitle(order.productId)}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      order.status === "paid" ? "bg-success text-paper" : "bg-line text-muted"
                    }`}
                  >
                    {order.status === "paid" ? "Lunas ✓" : "Menunggu"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <div className="sticky bottom-0 border-t border-line bg-paper p-4">
        <Link
          href="/products/new"
          className="mx-auto flex max-w-md items-center justify-center rounded-2xl bg-primary px-6 py-4 font-medium text-paper"
        >
          + Buat Produk
        </Link>
      </div>
    </div>
  );
}
