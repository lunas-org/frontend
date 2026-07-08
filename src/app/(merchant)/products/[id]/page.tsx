"use client";

// Product detail — CLAUDE.md §9 screen 4, redesigned per the Claude Design mockup (screen 06):
// QR card, copy-link + WhatsApp actions, the raw link shown inline, "Preview as buyer".

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, CheckCircle, Link as LinkIcon, WhatsappLogo, Eye } from "@phosphor-icons/react/dist/ssr";
import { getProduct, getOrdersForProduct, getProfile, type Product, type Order } from "@/lib/store";
import { CalmLoader } from "@/components/CalmLoader";
import { toast } from "@/components/Toast";
import { idrEstimate } from "@/lib/format";

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
    toast("Payment link copied");
    setTimeout(() => setCopied(false), 1800);
  }

  if (!product || !checkoutUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <CalmLoader label="Loading..." />
      </div>
    );
  }

  const paidCount = orders.filter((o) => o.status === "paid").length;
  const whatsappText = encodeURIComponent(`Pay for "${product.title}" ($${product.priceUsd}): ${checkoutUrl}`);
  const shortLink = checkoutUrl.replace(/^https?:\/\//, "").replace(/\?.*$/, `/${product.id.slice(0, 8)}`);

  return (
      <div className="flex min-h-screen flex-col px-6 pb-7 animate-fade-up">
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
            {paidCount} paid
          </div>
        </div>

        <div className="flex flex-col items-center gap-3.5 rounded-[22px] border border-line bg-white p-6 shadow-[0_6px_24px_rgba(21,22,27,0.05)]">
          <QRCodeSVG value={checkoutUrl} size={210} />
          <p className="text-center text-[13px] text-muted">Buyers scan this to pay instantly</p>
        </div>

        <div className="mt-4 flex gap-2.5">
          <button
            onClick={handleCopy}
            className={`flex h-[50px] flex-1 items-center justify-center gap-2 rounded-[13px] border border-line bg-white text-sm font-semibold transition-transform hover:bg-black/[.03] active:scale-95 ${
              copied ? "text-success" : "text-ink"
            }`}
          >
            {copied ? <CheckCircle weight="fill" className="text-lg" /> : <LinkIcon className="text-lg" />}
            {copied ? "Copied" : "Copy link"}
          </button>
          <a
            href={`https://wa.me/?text=${whatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[50px] flex-1 items-center justify-center gap-2 rounded-[13px] bg-success text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-95"
          >
            <WhatsappLogo weight="fill" className="text-lg" />
            WhatsApp
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
          Preview as buyer
        </button>
      </div>
  );
}
