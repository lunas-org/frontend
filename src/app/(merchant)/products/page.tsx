"use client";

// Products list — bottom nav "Products" tab target. Not in the original Claude Design mockup
// as a standalone screen (the mockup's nav jumps straight to a single active product), but our
// real app can have many products, so this fills that gap with the same row style the mockup
// uses on its Settings screen.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Tag, CaretRight, Plus } from "@phosphor-icons/react/dist/ssr";
import { isLoggedIn } from "@/lib/magic";
import { listProducts, listOrders, type Product } from "@/lib/store";
import { CalmLoader } from "@/components/CalmLoader";
import { useI18n } from "@/lib/i18n";

export default function ProductsListPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);
  const [paidCounts, setPaidCounts] = useState<Record<string, number>>({});
  const [ready, setReady] = useState(false);
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
      const ps = listProducts();
      const orders = listOrders();
      const counts: Record<string, number> = {};
      for (const o of orders) {
        if (o.status === "paid") counts[o.productId] = (counts[o.productId] ?? 0) + 1;
      }
      setProducts(ps);
      setPaidCounts(counts);
      setReady(true);
    })();
  }, [router]);

  return (
    <div className="min-h-screen px-6 pb-[92px]">
        <div className="flex items-center justify-between py-5">
          <h1 className="font-display text-[22px] font-extrabold tracking-tight text-ink">{t("products.title")}</h1>
          <button
            onClick={() => router.push("/products/new")}
            className="flex h-9 items-center gap-1.5 rounded-[10px] bg-primary px-3.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 active:scale-95"
          >
            <Plus className="text-base" />
            {t("products.new")}
          </button>
        </div>

        {!ready && (
          <div className="flex justify-center py-10">
            <CalmLoader label={t("common.loading")} />
          </div>
        )}

        {ready && products.length === 0 && (
          <div className="flex flex-col items-center gap-3.5 rounded-[20px] border border-dashed border-line bg-white px-6 py-9 text-center">
            <Image src="/empty-products.png" alt="" width={128} height={128} className="animate-float" />
            <p className="font-display text-base font-bold text-ink">{t("products.emptyTitle")}</p>
            <p className="max-w-[230px] text-[13px] leading-relaxed text-muted">{t("products.emptyDesc")}</p>
            <button
              onClick={() => router.push("/products/new")}
              className="h-[42px] rounded-xl border border-primary/30 px-5 text-[13.5px] font-semibold text-primary transition-colors hover:bg-primary/[.06] active:scale-95"
            >
              {t("products.emptyCta")}
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => router.push(`/products/${p.id}`)}
              className="flex w-full items-center gap-3.5 rounded-[15px] border border-line bg-white px-4 py-[15px] text-left transition-transform hover:border-primary/30 active:scale-[.98]"
            >
              <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl bg-primary/[.07]">
                <Tag className="text-[17px] text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{p.title}</p>
                <p className="mt-0.5 text-xs text-muted">{t("products.paidCount", { count: paidCounts[p.id] ?? 0 })}</p>
              </div>
              <span className="font-display whitespace-nowrap text-[14.5px] font-bold text-ink">${p.priceUsd}</span>
              <CaretRight className="text-[15px] text-muted" />
            </button>
          ))}
        </div>
    </div>
  );
}
