"use client";

// Shareable receipt — a standalone, login-free page both buyer and merchant can open and pass
// around (WhatsApp, etc.). Like checkout, all data comes from URL params (the buyer's browser
// can't read the merchant store), so a receipt link is fully self-contained. This turns every
// payment into a branded, forwardable artifact — a trust + growth surface. Buyer-safe copy; no
// wallet/chain/crypto language.

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { WhatsappLogo, ShareNetwork } from "@phosphor-icons/react/dist/ssr";
import { Frame } from "@/components/Frame";
import { toast } from "@/components/Toast";
import { idrEstimate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

function ReceiptContent() {
  const params = useSearchParams();
  const { t } = useI18n();
  const merchantName = params.get("merchant") || t("checkout.defaultBusiness");
  const productName = params.get("title") || t("receipt.purchase");
  const price = params.get("price") || "0.00";
  const orderId = params.get("orderId");
  const waTarget = params.get("wa");
  const ts = params.get("ts");

  const receipt = orderId ? `#LNS-${orderId.slice(2, 6).toUpperCase()}` : "#LNS-4127";
  const dateLabel = new Date(ts ? Number(ts) : Date.now()).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const idr = idrEstimate(price);

  async function share() {
    const url = window.location.href;
    const text = `Lunas ✓ receipt — ${price} USDC paid to ${merchantName} for "${productName}" (${receipt}).`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Lunas receipt", text, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast(t("checkout.receiptCopied"));
      }
    } catch {
      // share sheet dismissed — nothing to do
    }
  }

  return (
    <div className="flex min-h-screen flex-col px-6 pb-7 animate-fade-up">
      <div className="flex items-center justify-center gap-2 py-[18px]">
        <Image src="/icon.png" alt="" width={22} height={22} />
        <span className="text-[12.5px] font-semibold tracking-wide text-muted">{t("common.securedBy")}</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <Image src="/success-share.png" alt="" width={150} height={150} className="animate-float" />
        <div>
          <p className="font-display text-[34px] font-extrabold tracking-tight text-success">{t("checkout.successTitle")}</p>
          <p className="mt-1.5 text-[14px] text-muted">{t("receipt.paidInFull", { date: dateLabel })}</p>
        </div>

        <div className="w-full max-w-[340px] rounded-2xl border border-line bg-white p-[22px] shadow-[0_6px_24px_rgba(21,22,27,0.05)]">
          <Row label={t("receipt.paidTo")} value={merchantName} />
          <Row label={t("receipt.for")} value={productName} />
          <div className="flex items-start justify-between py-1.5 text-[13.5px]">
            <span className="text-muted">{t("receipt.amount")}</span>
            <span className="text-right">
              <span className="font-display font-bold text-ink">{price} USDC</span>
              {idr && <span className="block text-[12px] font-medium text-muted">{idr}</span>}
            </span>
          </div>
          <div className="mt-1.5 flex justify-between border-t border-dashed border-line pt-2.5 text-[13.5px]">
            <span className="text-muted">{t("receipt.receipt")}</span>
            <span className="font-semibold text-primary">{receipt}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <button
          onClick={share}
          className="flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-primary text-[15.5px] font-semibold text-white transition-transform active:scale-[.97]"
        >
          <ShareNetwork weight="fill" className="text-lg" />
          {t("receipt.share")}
        </button>
        {waTarget && (
          <a
            href={`https://wa.me/${waTarget}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-muted transition-colors hover:bg-black/[.04] hover:text-ink"
          >
            <WhatsappLogo weight="fill" className="text-lg text-success" />
            {t("receipt.message", { name: merchantName })}
          </a>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-[13.5px]">
      <span className="flex-none text-muted">{label}</span>
      <span className="truncate text-right font-semibold text-ink">{value}</span>
    </div>
  );
}

function ReceiptFallback() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted">{t("common.loading")}</p>
    </div>
  );
}

export default function ReceiptPage() {
  return (
    <Frame>
      <Suspense fallback={<ReceiptFallback />}>
        <ReceiptContent />
      </Suspense>
    </Frame>
  );
}
