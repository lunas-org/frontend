"use client";

// Product detail — CLAUDE.md §9 screen 4: the QR (large), the shareable link, "Bagikan via
// WhatsApp", live count of paid orders.

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { getProduct, getOrdersForProduct, type Product, type Order } from "@/lib/store";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const p = getProduct(params.id);
    if (!p) {
      router.replace("/dashboard");
      return;
    }
    const productOrders = getOrdersForProduct(params.id);
    setProduct(p);
    setOrders(productOrders);

    const order = productOrders[0];
    if (order) {
      const url = new URL("/checkout", window.location.origin);
      url.searchParams.set("title", p.title);
      url.searchParams.set("price", p.priceUsd);
      url.searchParams.set("address", order.sraAddress);
      url.searchParams.set("orderId", order.id);
      url.searchParams.set("checkoutAddress", order.checkoutAddress);
      url.searchParams.set("chainId", String(order.chainId));
      setCheckoutUrl(url.toString());
    }
  }, [params.id, router]);

  async function handleCopy() {
    if (!checkoutUrl) return;
    await navigator.clipboard.writeText(checkoutUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!product || !checkoutUrl) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p className="text-muted">Memuat...</p>
      </main>
    );
  }

  const paidCount = orders.filter((o) => o.status === "paid").length;
  const whatsappText = encodeURIComponent(`Bayar "${product.title}" ($${product.priceUsd}): ${checkoutUrl}`);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-5 pt-6">
        <Link href="/dashboard" className="text-sm text-muted">
          ← Kembali
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center gap-6 px-5 pb-28 pt-4 text-center">
        <div>
          <p className="text-lg font-medium text-ink">{product.title}</p>
          <p className="font-display text-3xl font-semibold tabular-nums text-ink">
            ${product.priceUsd}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <QRCodeSVG value={checkoutUrl} size={220} />
        </div>

        <button
          onClick={handleCopy}
          className="w-full max-w-sm rounded-2xl border border-line px-4 py-3 text-sm text-muted"
        >
          {copied ? "Disalin!" : "Salin link pembayaran"}
        </button>

        <p className="text-sm text-muted">
          {paidCount === 0 ? "Belum ada yang bayar" : `${paidCount} pesanan sudah Lunas`}
        </p>
      </main>

      <div className="sticky bottom-0 border-t border-line bg-paper p-4">
        <a
          href={`https://wa.me/?text=${whatsappText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-auto flex max-w-sm items-center justify-center rounded-2xl bg-primary px-6 py-4 font-medium text-paper"
        >
          Bagikan via WhatsApp
        </a>
      </div>
    </div>
  );
}
