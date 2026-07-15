"use client";

// Buyer checkout — CLAUDE.md §9 screens 5–7 (Checkout, Processing, Success), redesigned per the
// Claude Design mockup (screens 08–11b). No login required. Reads product/order data from the
// URL (no Supabase yet — see src/lib/store.ts's comment on why the buyer's browser can't read
// the merchant's local store). Polls Checkout.sol's `paid` mapping directly on-chain so the
// status flips to "Lunas ✓" automatically — CLAUDE.md calls this the most-critical-to-be-smooth
// part of the whole product.
//
// `?demo=1` runs the same screens against a client-side timer instead of the chain — this is
// CLAUDE.md §10 W6's "demo-mode... as live-demo insurance", not a second real payment path.

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import Image from "next/image";
import { createPublicClient, http } from "viem";
import { arbitrum, arbitrumSepolia } from "viem/chains";
import { Storefront, WhatsappLogo, ArrowLeft, Copy } from "@phosphor-icons/react/dist/ssr";
import { checkoutAbi } from "@/lib/checkoutAbi";
import { Frame } from "@/components/Frame";
import { toast } from "@/components/Toast";
import { idrEstimate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { CalmLoader } from "@/components/CalmLoader";

const POLL_INTERVAL_MS = 4000;

type Screen = "checkout" | "processing" | "pending" | "success" | "errExpired" | "errPaid" | "underpaid" | "unsupportedToken";
type T = ReturnType<typeof useI18n>["t"];

function chainById(chainId: number) {
  return chainId === arbitrum.id ? arbitrum : arbitrumSepolia;
}

function agoLabel(ts: number, t: T) {
  const s = Math.floor((Date.now() - ts) / 1000);
  return s < 2 ? t("checkout.justNow") : t("checkout.secondsAgo", { s });
}

function SecuredHeader({ onBack }: { onBack?: () => void }) {
  const { t } = useI18n();
  return (
    <div className="relative flex items-center justify-center gap-2 py-[18px]">
      {onBack && (
        <button
          onClick={onBack}
          aria-label={t("common.back")}
          className="absolute left-0 flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-black/5 active:scale-95"
        >
          <ArrowLeft className="text-lg" />
        </button>
      )}
      <Image src="/icon.png" alt="" width={22} height={22} />
      <span className="text-[12.5px] font-semibold tracking-wide text-muted">{t("common.securedBy")}</span>
    </div>
  );
}

function CheckoutContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();
  const isDemo = params.get("demo") === "1";
  const isPreview = params.get("preview") === "1";
  const handleBack = isPreview
    ? () => router.back()
    : isDemo
      ? () => router.push("/")
      : undefined;
  const title = params.get("title");
  const priceUsd = params.get("price");
  const address = params.get("address");
  const orderId = params.get("orderId") as `0x${string}` | null;
  const checkoutAddress = params.get("checkoutAddress") as `0x${string}` | null;
  const chainId = params.get("chainId");
  const merchantName = params.get("merchant") || t("checkout.defaultBusiness");
  const waTarget = params.get("wa");
  // Reveal-the-magic line (CLAUDE.md §9): briefly names the source chain the SRA just routed
  // from, right before "Lunas ✓". Reads as reassurance to the buyer, reads as cross-chain to
  // judges. `sourceChain` isn't wired from the SRA route yet on the real path (no event/webhook
  // surfaces it today) — demo mode hardcodes "Base" to match the CLAUDE.md §11 demo script.
  const sourceChain = isDemo ? "Base" : params.get("sourceChain");

  const [screen, setScreen] = useState<Screen>("checkout");
  const [lastChecked, setLastChecked] = useState<number | null>(null);
  const [, setTick] = useState(0);
  const checkedInitialRef = useRef(false);

  const missingRealParams = !isDemo && (!title || !priceUsd || !address);

  // Real (non-demo) flow: check once on load whether this order is already settled — a buyer
  // reopening a paid link, or a merchant using "Preview as buyer" after payment — and then poll
  // for the moment it flips.
  useEffect(() => {
    if (isDemo || missingRealParams || !orderId || !checkoutAddress || !chainId) return;

    const client = createPublicClient({ chain: chainById(Number(chainId)), transport: http() });
    let cancelled = false;

    async function poll() {
      try {
        const isPaid = await client.readContract({
          address: checkoutAddress!,
          abi: checkoutAbi,
          functionName: "paid",
          args: [orderId!],
        });
        if (cancelled) return;
        if (isPaid) {
          setScreen(checkedInitialRef.current ? "success" : "errPaid");
        }
        checkedInitialRef.current = true;
      } catch {
        // transient RPC errors are fine — just retry on the next tick
      } finally {
        if (!cancelled) setLastChecked(Date.now());
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isDemo, missingRealParams, orderId, checkoutAddress, chainId]);

  // Re-render once a second so the "updated Xs ago" liveness label counts up between polls.
  useEffect(() => {
    if (isDemo || missingRealParams) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [isDemo, missingRealParams]);

  // Demo flow: "simulate a payment" walks through processing -> success on a timer, matching
  // the mockup exactly, so a live demo never depends on real routing latency.
  const demoTimerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(demoTimerRef.current), []);
  function simulatePay() {
    // processing (listening) -> pending (detected, confirming) -> success — a granular 3-beat
    // that reads like the real routing/settlement stages.
    setScreen("processing");
    demoTimerRef.current = setTimeout(() => {
      setScreen("pending");
      demoTimerRef.current = setTimeout(() => setScreen("success"), 1600);
    }, 2600);
  }
  function simulateUnderpaid() {
    setScreen("processing");
    demoTimerRef.current = setTimeout(() => setScreen("underpaid"), 3200);
  }
  function simulateUnsupportedToken() {
    setScreen("unsupportedToken");
  }

  if (missingRealParams) {
    return <ExpiredScreen waTarget={waTarget} onBack={handleBack} />;
  }

  const displayTitle = title ?? "Workshop ticket";
  const displayPrice = priceUsd ?? "25.00";

  if (screen === "errPaid") {
    return (
      <AlreadyPaidScreen merchantName={merchantName} onView={() => setScreen("success")} onBack={handleBack} />
    );
  }

  if (screen === "underpaid") {
    return (
      <UnderpaidScreen
        productPrice={displayPrice}
        receivedAmount={(Number(displayPrice) - 5 > 0 ? Number(displayPrice) - 5 : Number(displayPrice) * 0.7).toFixed(2)}
        waTarget={waTarget}
        onSendRest={() => setScreen("checkout")}
        onBack={handleBack}
      />
    );
  }

  if (screen === "unsupportedToken") {
    return <UnsupportedTokenScreen onBack={() => setScreen("checkout")} onBackToMerchant={handleBack} />;
  }

  if (screen === "processing") {
    return <ProcessingScreen productName={displayTitle} productPrice={displayPrice} onBack={handleBack} />;
  }

  if (screen === "pending") {
    return <PendingScreen productName={displayTitle} productPrice={displayPrice} sourceChain={sourceChain} />;
  }

  if (screen === "success") {
    return (
      <SuccessScreen
        merchantName={merchantName}
        productName={displayTitle}
        productPrice={displayPrice}
        orderId={orderId}
        waTarget={waTarget}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col px-6 pb-7 animate-fade-up">
      <SecuredHeader onBack={handleBack} />
      <div className="@lg:mx-auto @lg:flex @lg:max-w-[720px] @lg:flex-row @lg:items-center @lg:justify-center @lg:gap-14">
        <div className="flex flex-col items-center gap-1.5 py-1.5 text-center @lg:items-start @lg:text-left">
          <div className="flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-full glass-card">
            <Storefront className="text-2xl text-muted" />
          </div>
          <p className="mt-1.5 text-[13.5px] text-muted">
            {t("checkout.paying")} <span className="font-semibold text-ink">{merchantName}</span>
          </p>
          <p className="text-[15.5px] font-semibold text-ink">{displayTitle}</p>
          <p className="font-display mt-1 text-[40px] font-extrabold tracking-tight text-ink">
            {displayPrice} <span className="text-[17px] font-semibold text-muted">USDC</span>
          </p>
          {idrEstimate(displayPrice) && (
            <p className="-mt-0.5 text-[13px] font-medium text-muted">{idrEstimate(displayPrice)}</p>
          )}
        </div>

        <div className="mt-[18px] flex flex-col items-center gap-3 rounded-[22px] glass-card p-[26px] shadow-[0_6px_24px_rgba(21,22,27,0.05)] @lg:mt-0 @lg:flex-none">
          <QRCodeSVG value={isDemo ? "https://lunas.app/demo" : address!} size={200} />
          <p className="text-center text-[13.5px] text-muted">{t("checkout.scan")}</p>
          {!isDemo && address && (
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(address);
                toast(t("checkout.addressCopied"));
              }}
              className="mt-1 flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-[12.5px] font-semibold text-ink transition-transform active:scale-95"
            >
              <Copy className="text-[15px] text-primary" />
              <span className="font-mono">{`${address.slice(0, 6)}…${address.slice(-4)}`}</span>
            </button>
          )}
          <p className="text-center text-[11.5px] leading-relaxed text-muted">{t("checkout.copyHint")}</p>
        </div>
      </div>

      {!isDemo && lastChecked && (
        <div className="mt-3 flex items-center justify-center gap-2 text-[12px] text-muted">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-success/60" style={{ animation: "ripple 1.6s ease-out infinite" }} />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          {t("checkout.listening", { ago: agoLabel(lastChecked, t) })}
        </div>
      )}

      {waTarget && (
        <a
          href={`https://wa.me/${waTarget}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3.5 flex items-center justify-center gap-1.5 text-[12.5px] text-muted transition-colors hover:text-success active:scale-[.98]"
        >
          <WhatsappLogo className="text-base" />
          {t("checkout.questions", { name: merchantName })}
        </a>
      )}

      <div className="flex-1" />

      {isDemo && (
        <div className="mt-5 flex flex-col gap-3 border-t border-dashed border-line pt-5">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[.1em] text-muted">
            Demo controls
          </p>
          <button
            onClick={simulatePay}
            className="h-12 rounded-[13px] border-[1.5px] border-dashed border-primary/40 text-[13.5px] font-semibold text-primary transition-colors hover:bg-primary/5 active:scale-[.97]"
          >
            ▶ Demo: simulate a payment
          </button>
          <button
            onClick={simulateUnderpaid}
            className="h-11 rounded-[13px] border-[1.5px] border-dashed border-amber-500/45 text-[12.5px] font-semibold text-amber-600 transition-colors hover:bg-amber-500/5 active:scale-[.97]"
          >
            ▶ Demo: underpaid
          </button>
          <button
            onClick={simulateUnsupportedToken}
            className="h-11 rounded-[13px] border-[1.5px] border-dashed border-danger/40 text-[12.5px] font-semibold text-danger transition-colors hover:bg-danger/5 active:scale-[.97]"
          >
            ▶ Demo: unsupported token
          </button>
        </div>
      )}
    </div>
  );
}

function ProcessingScreen({
  productName,
  productPrice,
  onBack,
}: {
  productName: string;
  productPrice: string;
  onBack?: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen flex-col px-6 pb-7 @lg:mx-auto @lg:w-full @lg:max-w-[480px] animate-fade-in">
      <SecuredHeader onBack={onBack} />
      <div className="flex flex-1 flex-col items-center justify-center gap-[26px] text-center">
        <div className="relative flex h-[180px] w-[180px] items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-primary/10" style={{ animation: "ripple 2s ease-out infinite" }} />
          <span className="absolute inset-0 rounded-full bg-primary/10" style={{ animation: "ripple 2s ease-out .7s infinite" }} />
          <span className="absolute inset-0 rounded-full bg-primary/10" style={{ animation: "ripple 2s ease-out 1.4s infinite" }} />
          <Image src="/payment-processing.png" alt="" width={150} height={150} className="animate-breathe" />
        </div>
        <div>
          <p className="font-display mb-1.5 text-2xl font-extrabold tracking-tight text-ink">
            {t("checkout.processingTitle")}
          </p>
          <p className="inline-flex items-center gap-1.5 text-sm text-muted">
            {t("checkout.processingSub")}
            <span className="flex gap-[3px]">
              <span className="dot-blink h-1 w-1 rounded-full bg-muted" />
              <span className="dot-blink h-1 w-1 rounded-full bg-muted" style={{ animationDelay: ".2s" }} />
              <span className="dot-blink h-1 w-1 rounded-full bg-muted" style={{ animationDelay: ".4s" }} />
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl glass-card px-[18px] py-3">
          <span className="text-[13px] text-muted">{productName}</span>
          <span className="font-display text-[14.5px] font-bold text-ink">{productPrice} USDC</span>
        </div>
      </div>
      <p className="text-center text-xs text-muted">{t("checkout.processingKeepOpen")}</p>
    </div>
  );
}

function PendingScreen({
  productName,
  productPrice,
  sourceChain,
}: {
  productName: string;
  productPrice: string;
  sourceChain?: string | null;
}) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen flex-col px-6 pb-7 @lg:mx-auto @lg:w-full @lg:max-w-[480px] animate-fade-in">
      <SecuredHeader />
      <div className="flex flex-1 flex-col items-center justify-center gap-[26px] text-center">
        <Image src="/payment-pending.png" alt="" width={160} height={160} className="animate-float" />
        <div>
          <p className="font-display mb-1.5 text-2xl font-extrabold tracking-tight text-ink">
            {t("checkout.pendingTitle")}
          </p>
          {sourceChain ? (
            <p className="animate-fade-up text-sm font-medium text-success">
              {t("checkout.receivedFrom", { chain: sourceChain })}
            </p>
          ) : (
            <p className="inline-flex items-center gap-1.5 text-sm text-muted">
              {t("checkout.pendingSub")}
              <span className="flex gap-[3px]">
                <span className="dot-blink h-1 w-1 rounded-full bg-muted" />
                <span className="dot-blink h-1 w-1 rounded-full bg-muted" style={{ animationDelay: ".2s" }} />
                <span className="dot-blink h-1 w-1 rounded-full bg-muted" style={{ animationDelay: ".4s" }} />
              </span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 rounded-2xl glass-card px-[18px] py-3">
          <span className="text-[13px] text-muted">{productName}</span>
          <span className="font-display text-[14.5px] font-bold text-ink">{productPrice} USDC</span>
        </div>
      </div>
    </div>
  );
}

function SuccessScreen({
  merchantName,
  productName,
  productPrice,
  orderId,
  waTarget,
}: {
  merchantName: string;
  productName: string;
  productPrice: string;
  orderId: string | null;
  waTarget?: string | null;
}) {
  const { t } = useI18n();
  const receipt = orderId ? `#LNS-${orderId.slice(2, 6).toUpperCase()}` : "#LNS-4127";

  function receiptUrl() {
    const url = new URL("/receipt", window.location.origin);
    url.searchParams.set("merchant", merchantName);
    url.searchParams.set("title", productName);
    url.searchParams.set("price", productPrice);
    if (orderId) url.searchParams.set("orderId", orderId);
    if (waTarget) url.searchParams.set("wa", waTarget);
    url.searchParams.set("ts", String(Date.now()));
    return url.toString();
  }

  async function shareReceipt() {
    const url = receiptUrl();
    const text = `Lunas ✓ · paid ${productPrice} USDC to ${merchantName} for "${productName}". Receipt ${receipt}.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Lunas receipt", text, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast(t("checkout.receiptCopied"));
      }
    } catch {
      // user dismissed the share sheet — nothing to do
    }
  }

  return (
    <div className="flex min-h-screen flex-col px-6 pb-7 @lg:mx-auto @lg:w-full @lg:max-w-[480px] animate-fade-in">
      <div className="flex flex-1 flex-col items-center justify-center gap-[22px] pt-[26px] text-center">
        <div className="relative flex h-[150px] w-[150px] items-center justify-center">
          <span
            className="absolute inset-0 rounded-full bg-success/[.18]"
            style={{ animation: "ripple 1.1s ease-out .15s both" }}
          />
          <span
            className="absolute left-[18px] top-1.5 h-1.5 w-1.5 rounded-full bg-success"
            style={{ animation: "confettiUp 1s ease-out .35s both" }}
          />
          <span
            className="absolute right-[26px] top-0.5 h-1.5 w-1.5 rounded-full bg-primary"
            style={{ animation: "confettiUp 1.1s ease-out .45s both" }}
          />
          <span
            className="absolute right-0.5 top-3.5 h-1 w-1 rounded-full bg-mint"
            style={{ animation: "confettiUp .95s ease-out .5s both" }}
          />
          <div
            className="flex h-[116px] w-[116px] items-center justify-center rounded-full bg-success shadow-[0_14px_40px_rgba(31,157,120,0.35)]"
            style={{ animation: "popIn .5s cubic-bezier(.2,1.4,.4,1) both" }}
          >
            <svg width="58" height="58" viewBox="0 0 58 58" fill="none">
              <path
                d="M14 30.5 L25 41 L45 19"
                stroke="#fff"
                strokeWidth="6.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 60,
                  strokeDashoffset: 60,
                  animation: "drawCheck .45s cubic-bezier(.4,0,.2,1) .3s forwards",
                }}
              />
            </svg>
          </div>
        </div>
        <div className="animate-fade-up" style={{ animationDelay: ".5s" }}>
          <p className="font-display text-[38px] font-extrabold tracking-tight text-success">{t("checkout.successTitle")}</p>
          <p className="mt-2 text-[14.5px] text-muted">{t("checkout.successSub")}</p>
        </div>
        <div
          className="w-full max-w-[320px] rounded-2xl glass-card p-[22px] shadow-[0_6px_24px_rgba(21,22,27,0.05)] animate-fade-up"
          style={{ animationDelay: ".65s" }}
        >
          <Row label={t("checkout.paidTo")} value={merchantName} />
          <Row label={t("checkout.for")} value={productName} />
          <Row label={t("checkout.amount")} value={`${productPrice} USDC`} mono />
          <div className="mt-1.5 flex justify-between border-t border-dashed border-line pt-2.5 text-[13.5px]">
            <span className="text-muted">{t("checkout.receipt")}</span>
            <span className="font-semibold text-primary">{receipt}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2.5 animate-fade-up" style={{ animationDelay: ".8s" }}>
        <button
          onClick={shareReceipt}
          className="flex h-[52px] items-center justify-center rounded-2xl glass-btn text-[15.5px] font-semibold text-white transition-transform active:scale-[.97]"
        >
          {t("checkout.shareReceipt")}
        </button>
        <a
          href={typeof window !== "undefined" ? receiptUrl() : "#"}
          className="h-11 rounded-xl text-center text-sm font-medium leading-[44px] text-muted transition-colors hover:bg-black/[.04]"
        >
          {t("checkout.viewReceipt")}
        </a>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between py-1.5 text-[13.5px]">
      <span className="text-muted">{label}</span>
      <span className={mono ? "font-display font-bold text-ink" : "font-semibold text-ink"}>{value}</span>
    </div>
  );
}

function ExpiredScreen({ waTarget, onBack }: { waTarget: string | null; onBack?: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen flex-col px-6 pb-7 @lg:mx-auto @lg:w-full @lg:max-w-[480px] animate-fade-up">
      <SecuredHeader onBack={onBack} />
      <div className="flex flex-1 flex-col items-center justify-center gap-[18px] text-center">
        <Image src="/link-expired.png" alt="" width={150} height={150} className="animate-float" />
        <div>
          <p className="font-display mb-1.5 text-2xl font-extrabold tracking-tight text-ink">
            {t("checkout.expiredTitle")}
          </p>
          <p className="max-w-[260px] text-sm leading-relaxed text-muted">{t("checkout.expiredDesc")}</p>
        </div>
        {waTarget && (
          <a
            href={`https://wa.me/${waTarget}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[46px] items-center gap-2 rounded-[13px] glass-card px-[22px] text-sm font-semibold text-ink transition-transform active:scale-95"
          >
            <WhatsappLogo weight="fill" className="text-lg text-success" />
            {t("checkout.messageSeller")}
          </a>
        )}
      </div>
    </div>
  );
}

function AlreadyPaidScreen({
  merchantName,
  onView,
  onBack,
}: {
  merchantName: string;
  onView: () => void;
  onBack?: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen flex-col px-6 pb-7 @lg:mx-auto @lg:w-full @lg:max-w-[480px] animate-fade-up">
      <SecuredHeader onBack={onBack} />
      <div className="flex flex-1 flex-col items-center justify-center gap-[18px] text-center">
        <Image src="/paid-celebrate.png" alt="" width={150} height={150} className="animate-float" />
        <div>
          <p className="font-display mb-1.5 text-2xl font-extrabold tracking-tight text-ink">
            {t("checkout.alreadyPaidTitle")}
          </p>
          <p className="max-w-[270px] text-sm leading-relaxed text-muted">
            {t("checkout.alreadyPaidDesc", { name: merchantName })}
          </p>
        </div>
        <button
          onClick={onView}
          className="flex h-[46px] items-center rounded-[13px] glass-card px-[22px] text-sm font-semibold text-ink transition-transform active:scale-95"
        >
          {t("checkout.viewReceiptShort")}
        </button>
      </div>
    </div>
  );
}

function UnderpaidScreen({
  productPrice,
  receivedAmount,
  waTarget,
  onSendRest,
  onBack,
}: {
  productPrice: string;
  receivedAmount: string;
  waTarget: string | null;
  onSendRest: () => void;
  onBack?: () => void;
}) {
  const { t } = useI18n();
  const remaining = (Number(productPrice) - Number(receivedAmount)).toFixed(2);

  return (
    <div className="flex min-h-screen flex-col px-6 pb-7 @lg:mx-auto @lg:w-full @lg:max-w-[480px] animate-fade-up">
      <SecuredHeader onBack={onBack} />
      <div className="flex flex-1 flex-col items-center justify-center gap-[18px] text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
          <span className="font-display text-[34px] font-extrabold text-primary">!</span>
        </div>
        <div>
          <p className="font-display mb-1.5 text-2xl font-extrabold tracking-tight text-ink">
            {t("checkout.almostTitle")}
          </p>
          <p className="max-w-[280px] text-sm leading-relaxed text-muted">
            {t("checkout.almostDesc", { received: receivedAmount, remaining, total: productPrice })}
          </p>
        </div>
        <div className="w-full max-w-[320px] rounded-2xl glass-card p-[22px] shadow-[0_6px_24px_rgba(21,22,27,0.05)]">
          <Row label={t("checkout.received")} value={`${receivedAmount} USDC`} mono />
          <Row label={t("checkout.stillNeeded")} value={`${remaining} USDC`} mono />
        </div>
        <button
          onClick={onSendRest}
          className="flex h-[46px] items-center rounded-[13px] glass-btn px-[22px] text-sm font-semibold text-white transition-transform active:scale-95"
        >
          {t("checkout.sendRest")}
        </button>
        {waTarget && (
          <a
            href={`https://wa.me/${waTarget}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[46px] items-center gap-2 rounded-[13px] glass-card px-[22px] text-sm font-semibold text-ink transition-transform active:scale-95"
          >
            <WhatsappLogo weight="fill" className="text-lg text-success" />
            {t("checkout.askHelp")}
          </a>
        )}
      </div>
    </div>
  );
}

function UnsupportedTokenScreen({
  onBack,
  onBackToMerchant,
}: {
  onBack: () => void;
  onBackToMerchant?: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen flex-col px-6 pb-7 @lg:mx-auto @lg:w-full @lg:max-w-[480px] animate-fade-up">
      <SecuredHeader onBack={onBackToMerchant} />
      <div className="flex flex-1 flex-col items-center justify-center gap-[18px] text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-black/[.05]">
          <span className="font-display text-[30px] font-extrabold text-muted">?</span>
        </div>
        <div>
          <p className="font-display mb-1.5 text-2xl font-extrabold tracking-tight text-ink">
            {t("checkout.unsupportedTitle")}
          </p>
          <p className="max-w-[280px] text-sm leading-relaxed text-muted">{t("checkout.unsupportedDesc")}</p>
        </div>
        <a
          href="https://app.zerodev.app/sra"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-[46px] items-center rounded-[13px] glass-btn px-[22px] text-sm font-semibold text-white transition-transform active:scale-95"
        >
          {t("checkout.retrieve")}
        </a>
        <button
          onClick={onBack}
          className="h-11 rounded-xl px-[22px] text-sm font-medium text-muted transition-colors hover:bg-black/[.04]"
        >
          {t("checkout.tryDifferent")}
        </button>
      </div>
    </div>
  );
}

function CheckoutFallback() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen items-center justify-center">
      <CalmLoader label={t("common.loading")} />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Frame>
      <Suspense fallback={<CheckoutFallback />}>
        <CheckoutContent />
      </Suspense>
    </Frame>
  );
}
