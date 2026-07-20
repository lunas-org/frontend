"use client";

// Activity feed — bottom-nav "Activity" tab. There's no push/notification backend yet, so this
// derives a human-readable timeline from local store data: every settled order becomes a
// "Payment received — Lunas ✓" entry, every product a "Payment link created" entry. When there's
// nothing yet, it shows the empty-notification mascot. Real data, not a stub, so the tab earns
// its slot in the nav. When Supabase/SSE (see api/orders) lands, swap the source here.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CheckCircle, Tag, ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import { isLoggedIn } from "@/lib/magic";
import { listOrders, listProducts, type Product } from "@/lib/store";
import { explorerTxUrl } from "@/lib/explorer";
import { useI18n } from "@/lib/i18n";

type Feed = {
  id: string;
  kind: "paid" | "created";
  subtitle: string;
  amount?: string;
  ts: number;
  explorerUrl?: string;
};

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

export default function NotificationsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [feed, setFeed] = useState<Feed[]>([]);
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
      const products = listProducts();
      const byId = new Map<string, Product>(products.map((p) => [p.id, p]));
      const items: Feed[] = [];

      for (const o of listOrders()) {
        const p = byId.get(o.productId);
        if (o.status === "paid") {
          items.push({
            id: `paid-${o.id}`,
            kind: "paid",
            subtitle: p?.title ?? "",
            amount: p?.priceUsd,
            ts: o.paidAt ?? o.createdAt,
            explorerUrl: o.txHash ? (explorerTxUrl(o.chainId, o.txHash) ?? undefined) : undefined,
          });
        }
      }
      for (const p of products) {
        items.push({
          id: `created-${p.id}`,
          kind: "created",
          subtitle: p.title,
          ts: p.createdAt,
        });
      }

      items.sort((a, b) => b.ts - a.ts);
      setFeed(items);
      setReady(true);
    })();
  }, [router]);

  return (
    <div className="min-h-screen px-6 pb-[92px] @md:pb-10">
      <div className="flex items-baseline justify-between py-5">
        <h1 className="font-display text-[22px] font-extrabold tracking-tight text-ink">{t("activity.title")}</h1>
        {feed.length > 0 && <span className="text-[12.5px] text-muted">{t("activity.events", { count: feed.length })}</span>}
      </div>

      {ready && feed.length === 0 && (
        <div className="flex flex-col items-center gap-3.5 rounded-[20px] border border-dashed border-line bg-white px-6 py-11 text-center @lg:mx-auto @lg:max-w-[420px]">
          <Image src="/empty-notification.png" alt="" width={128} height={128} className="animate-float" />
          <div>
            <p className="font-display mb-1 text-base font-bold text-ink">{t("activity.emptyTitle")}</p>
            <p className="max-w-[240px] text-[13px] leading-relaxed text-muted">{t("activity.emptyDesc")}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5 @lg:grid @lg:grid-cols-2 @lg:gap-3">
        {feed.map((f) => {
          const paid = f.kind === "paid";
          const Icon = paid ? CheckCircle : Tag;
          return (
            <div key={f.id} className="flex items-center gap-3.5 rounded-2xl glass-card px-4 py-3.5">
              <div
                className={`flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl ${
                  paid ? "bg-success/10" : "bg-primary/[.07]"
                }`}
              >
                <Icon weight={paid ? "fill" : "regular"} className={`text-[18px] ${paid ? "text-success" : "text-primary"}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {t(paid ? "activity.paidTitle" : "activity.createdTitle")}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {f.subtitle || t("common.product")} · {relativeTime(f.ts)}
                </p>
              </div>
              {f.amount && (
                <div className="flex flex-none flex-col items-end gap-0.5">
                  <span className="font-display whitespace-nowrap text-[14.5px] font-bold text-success">+{f.amount}</span>
                  {f.explorerUrl && (
                    <a
                      href={f.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10.5px] font-semibold text-muted transition-colors hover:text-primary"
                    >
                      {t("activity.viewProof")}
                      <ArrowSquareOut className="text-[10.5px]" />
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
