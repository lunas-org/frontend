"use client";

// Product detail — CLAUDE.md §9 screen 4, redesigned per the Claude Design mockup (screen 06):
// QR card, copy-link + WhatsApp actions, the raw link shown inline, "Preview as buyer".

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, CheckCircle, Link as LinkIcon, WhatsappLogo, Eye } from "@phosphor-icons/react/dist/ssr";
import { getProduct, getOrdersForProduct, getProfile, type Product, type Order } from "@/lib/store";
import { CalmLoader } from "@/components/CalmLoader";
import { toast } from "@/components/Toast";
import { idrEstimate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const [product, setProduct] = useState<Product | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);

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
      const profile = getProfile();
      if (profile?.displayName) url.searchParams.set("merchant", profile.displayName);
      if (profile?.waNumber) url.searchParams.set("wa", profile.waNumber.replace(/[^0-9]/g, ""));
      setCheckoutUrl(url.toString());
    }
  }, [params.id, router]);

  async function handleCopy() {
    if (!checkoutUrl) return;
    await navigator.clipboard.writeText(checkoutUrl);
    setCopied(true);
    toast(t("toast.linkCopied"));
    setSent(true);
    setTimeout(() => setCopied(false), 1800);
  }

  if (!product || !checkoutUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <CalmLoader label={t("common.loading")} />
      </div>
    );
  }

  const paidCount = orders.filter((o) => o.status === "paid").length;
  const whatsappText = encodeURIComponent(
    t("detail.waShare", { title: product.title, price: product.priceUsd, url: checkoutUrl })
  );
  const shortLink = checkoutUrl.replace(/^https?:\/\//, "").replace(/\?.*$/, `/${product.id.slice(0, 8)}`);

  return (
      <div className="flex min-h-screen flex-col px-6 pb-7">
        <div className="flex items-center gap-2 py-3.5">
          <button
            onClick={() => router.push("/dashboard")}
            className="-ml-2.5 flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-black/5 active:scale-95"
          >
            <ArrowLeft className="text-xl text-ink" />
          </button>
          <h1 className="font-display flex-1 truncate text-[22px] font-extrabold tracking-tight text-ink">
            {product.title}
          </h1>
        </div>

        <div className="flex items-center gap-4 py-1 pb-[18px]">
          <div>
            <p className="font-display text-[26px] font-extrabold text-ink">
              {product.priceUsd} <span className="text-sm font-semibold text-muted">USDC</span>
            </p>
            {idrEstimate(product.priceUsd) && (
              <p className="text-[12.5px] font-medium text-muted">{idrEstimate(product.priceUsd)}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-[12.5px] font-semibold text-success">
            <CheckCircle weight="fill" className="text-[15px]" />
            {t("detail.paid", { count: paidCount })}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3.5 rounded-[22px] glass-card p-6 shadow-[0_6px_24px_rgba(21,22,27,0.05)]">
          <QRCodeSVG value={checkoutUrl} size={210} />
          <p className="text-center text-[13px] text-muted">{t("detail.scan")}</p>
        </div>

        <div className="mt-4 flex gap-2.5">
          <button
            onClick={handleCopy}
            className={`flex h-[50px] flex-1 items-center justify-center gap-2 rounded-[13px] glass-card text-sm font-semibold transition-transform hover:bg-black/[.03] active:scale-95 ${
              copied ? "text-success" : "text-ink"
            }`}
          >
            {copied ? <CheckCircle weight="fill" className="text-lg" /> : <LinkIcon className="text-lg" />}
            {copied ? t("detail.copied") : t("detail.copyLink")}
          </button>
          <a
            href={`https://wa.me/?text=${whatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setSent(true)}
            className="flex h-[50px] flex-1 items-center justify-center gap-2 rounded-[13px] bg-success text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-95"
          >
            <WhatsappLogo weight="fill" className="text-lg" />
            {t("detail.whatsapp")}
          </a>
        </div>

        <div className="mt-3.5 flex items-center gap-2.5 rounded-[13px] bg-primary/5 px-4 py-3.5">
          <LinkIcon className="flex-none text-[17px] text-primary" />
          <span className="truncate text-[13px] font-medium text-primary">{shortLink}</span>
        </div>

        <div className="flex-1" />

        <button
          onClick={() => {
            const previewUrl = new URL(checkoutUrl);
            previewUrl.searchParams.set("preview", "1");
            router.push(previewUrl.toString());
          }}
          className="flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-muted transition-colors hover:bg-black/[.04] hover:text-ink"
        >
          <Eye className="text-lg" />
          {t("detail.preview")}
        </button>

        {sent && (
          <div
            className="absolute inset-0 z-50 flex items-end justify-center bg-ink/30 backdrop-blur-[2px] animate-fade-in"
            onClick={() => setSent(false)}
          >
            <div
              className="mb-4 w-[calc(100%-32px)] rounded-[24px] border border-line bg-paper p-6 text-center shadow-[0_20px_60px_rgba(21,22,27,0.22)]"
              style={{ animation: "fadeUp .3s cubic-bezier(.2,.7,.3,1) both" }}
              onClick={(e) => e.stopPropagation()}
            >
              <Image src="/invoice-sent.png" alt="" width={132} height={132} className="mx-auto animate-float" />
              <p className="font-display mt-2 text-xl font-extrabold tracking-tight text-ink">{t("detail.sentTitle")}</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{t("detail.sentDesc")}</p>
              <button
                onClick={() => setSent(false)}
                className="mt-5 h-[48px] w-full rounded-2xl glass-btn text-[15px] font-semibold text-white transition-transform active:scale-[.97]"
              >
                {t("detail.sentDone")}
              </button>
            </div>
          </div>
        )}
      </div>
  );
}
