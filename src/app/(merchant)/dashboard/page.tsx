"use client";

// Merchant dashboard — CLAUDE.md §9 screen 2, redesigned per the Claude Design mockup (screen
// 04): balance card, "Create product" in the thumb zone, recent orders with a real empty state,
// bottom nav. Balance reads the merchant's actual USDC balance on Arbitrum (see
// src/lib/zerodev.ts's getUsdcBalance) since Checkout.sol forwards funds straight to the
// merchant's wallet — there's no separate ledger to fake.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, ArrowCircleUp, Check, User } from "@phosphor-icons/react/dist/ssr";
import { isLoggedIn, getMagicProvider } from "@/lib/magic";
import { createSmartAccountFromProvider, getUsdcBalance } from "@/lib/zerodev";
import { listOrders, listProducts, getProfile, type Order, type Product } from "@/lib/store";
import { useI18n } from "@/lib/i18n";

type Status = "loading" | "error" | "ready";

function relativeTime(ms: number) {
  const d = new Date(ms);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  if (isToday) return `Today · ${time}`;
  if (isYesterday) return `Yesterday · ${time}`;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${time}`;
}

export default function MerchantDashboardPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [balance, setBalance] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState<string | undefined>(undefined);

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
        const provider = getMagicProvider();
        const { address } = await createSmartAccountFromProvider(provider);

        const profile = getProfile();
        if (profile?.displayName) setDisplayName(profile.displayName);
        if (profile?.avatarDataUrl) setAvatar(profile.avatarDataUrl);

        setOrders(listOrders());
        setProducts(listProducts());

        try {
          setBalance(await getUsdcBalance(address));
        } catch {
          setBalance(null);
        }

        setStatus("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      }
    })();
  }, [router]);

  function productTitle(productId: string) {
    return products.find((p) => p.id === productId)?.title ?? "Product";
  }
  function productPrice(productId: string) {
    return products.find((p) => p.id === productId)?.priceUsd ?? "0.00";
  }

  const paidOrders = orders.filter((o) => o.status === "paid");
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekTotal = paidOrders
    .filter((o) => (o.paidAt ?? 0) >= weekAgo)
    .reduce((sum, o) => sum + parseFloat(productPrice(o.productId) || "0"), 0);

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <Image src="/network-error.png" alt="" width={150} height={150} className="animate-float" />
        <div>
          <p className="font-display text-xl font-extrabold tracking-tight text-ink">{t("dashboard.errorTitle")}</p>
          <p className="mt-1.5 max-w-[260px] text-sm leading-relaxed text-muted">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-[92px] animate-fade-up">
        <div className="flex items-center justify-between px-[22px] pb-1.5 pt-5">
          <div>
            <p className="text-[12.5px] text-muted">{t("dashboard.greeting")}</p>
            <p className="font-display mt-0.5 text-[19px] font-bold text-ink">{displayName || t("profile.defaultBusiness")}</p>
          </div>
          <button
            onClick={() => router.push("/settings")}
            className="flex h-[42px] w-[42px] items-center justify-center overflow-hidden rounded-full border border-line bg-white transition-transform active:scale-95"
          >
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" width={42} height={42} className="h-full w-full object-cover" />
            ) : (
              <User className="text-[19px] text-muted" />
            )}
          </button>
        </div>

        {status === "loading" ? (
          <div className="flex flex-col gap-3.5 px-[22px] py-4">
            <div className="skeleton h-[148px] rounded-[20px]" />
            <div className="skeleton h-[52px] rounded-2xl" />
            <div className="mt-2.5 h-5 w-[120px] rounded-md bg-black/[.06]" />
            <div className="skeleton h-16 rounded-2xl" />
            <div className="skeleton h-16 rounded-2xl" style={{ animationDelay: ".1s" }} />
          </div>
        ) : (
          <>
            <div className="px-[22px] pt-4">
              <div className="relative overflow-hidden rounded-[20px] bg-primary px-6 py-[26px] text-white">
                <div className="absolute -bottom-[38px] -right-[30px] h-[150px] w-[150px] rounded-full bg-white/5" />
                <div className="absolute -bottom-3.5 right-3.5 h-[74px] w-[74px] rounded-full bg-mint/10" />
                <p className="relative text-[12.5px] text-white/65">{t("dashboard.balance")}</p>
                <p className="font-display relative mt-1.5 text-[38px] font-extrabold leading-none tracking-tight">
                  {balance ?? "0.00"} <span className="text-base font-semibold text-white/60">USDC</span>
                </p>
                <div className="relative mt-3.5 flex items-center gap-1.5 text-[12.5px] text-mint">
                  <ArrowCircleUp weight="fill" className="text-[15px]" />
                  {t("dashboard.thisWeek", { amount: weekTotal.toFixed(2) })}
                </div>
              </div>

              <button
                onClick={() => router.push("/products/new")}
                className="mt-3.5 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-ink text-[15px] font-semibold text-white transition-opacity hover:opacity-90 active:scale-[.97]"
              >
                <Plus className="text-lg" />
                {t("dashboard.createProduct")}
              </button>
            </div>

            <div className="px-[22px] pt-[26px]">
              <div className="mb-3 flex items-baseline justify-between">
                <p className="font-display text-[16.5px] font-bold text-ink">{t("dashboard.recentOrders")}</p>
                {orders.length > 0 && <span className="text-[12.5px] text-muted">{t("dashboard.total", { count: orders.length })}</span>}
              </div>

              {orders.length === 0 ? (
                <div className="flex flex-col items-center gap-3.5 rounded-[20px] border border-dashed border-line bg-white px-6 py-9 text-center">
                  <Image src="/empty-orders.png" alt="" width={128} height={128} className="animate-float" />

                  <div>
                    <p className="font-display mb-1 text-base font-bold text-ink">{t("dashboard.emptyTitle")}</p>
                    <p className="max-w-[230px] text-[13px] leading-relaxed text-muted">{t("dashboard.emptyDesc")}</p>
                  </div>
                  <button
                    onClick={() => router.push("/products/new")}
                    className="h-[42px] rounded-xl border border-primary/30 px-5 text-[13.5px] font-semibold text-primary transition-colors hover:bg-primary/[.06] active:scale-95"
                  >
                    {t("dashboard.emptyCta")}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {orders.map((o) => (
                    <div key={o.id} className="flex items-center gap-3.5 rounded-2xl border border-line bg-white px-4 py-3.5">
                      <div
                        className={`flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl ${
                          o.status === "paid" ? "bg-success/10" : "bg-black/[.05]"
                        }`}
                      >
                        <Check weight="fill" className={`text-[17px] ${o.status === "paid" ? "text-success" : "text-muted"}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{productTitle(o.productId)}</p>
                        <p className="mt-0.5 text-xs text-muted">{relativeTime(o.paidAt ?? o.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-[14.5px] font-bold text-ink">+{productPrice(o.productId)}</p>
                        <p className={`mt-0.5 text-[11px] font-semibold ${o.status === "paid" ? "text-success" : "text-muted"}`}>
                          {o.status === "paid" ? t("dashboard.paid") : t("dashboard.pending")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
    </div>
  );
}
