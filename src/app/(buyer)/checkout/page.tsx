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
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import Image from "next/image";
import { createPublicClient, http } from "viem";
import { arbitrum, arbitrumSepolia } from "viem/chains";
import { Storefront, WhatsappLogo, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { checkoutAbi } from "@/lib/checkoutAbi";
import { Frame } from "@/components/Frame";

const POLL_INTERVAL_MS = 4000;

type Screen = "checkout" | "processing" | "success" | "errExpired" | "errPaid";

function chainById(chainId: number) {
  return chainId === arbitrum.id ? arbitrum : arbitrumSepolia;
}

function SecuredHeader() {
  return (
    <div className="flex items-center justify-center gap-2 py-[18px]">
      <Image src="/icon.png" alt="" width={22} height={22} />
      <span className="text-[12.5px] font-semibold tracking-wide text-muted">Secured by Lunas</span>
    </div>
  );
}

function CheckoutContent() {
  const params = useSearchParams();
  const isDemo = params.get("demo") === "1";
  const title = params.get("title");
  const priceUsd = params.get("price");
  const address = params.get("address");
  const orderId = params.get("orderId") as `0x${string}` | null;
  const checkoutAddress = params.get("checkoutAddress") as `0x${string}` | null;
  const chainId = params.get("chainId");
  const merchantName = params.get("merchant") || "Your business";
  const waTarget = params.get("wa");

  const [screen, setScreen] = useState<Screen>("checkout");
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
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isDemo, missingRealParams, orderId, checkoutAddress, chainId]);

  // Demo flow: "simulate a payment" walks through processing -> success on a timer, matching
  // the mockup exactly, so a live demo never depends on real routing latency.
  const demoTimerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(demoTimerRef.current), []);
  function simulatePay() {
    setScreen("processing");
    demoTimerRef.current = setTimeout(() => setScreen("success"), 3200);
  }

  if (missingRealParams) {
    return <ExpiredScreen waTarget={waTarget} />;
  }

  const displayTitle = title ?? "Workshop ticket";
  const displayPrice = priceUsd ?? "25.00";

  if (screen === "errPaid") {
    return <AlreadyPaidScreen merchantName={merchantName} onView={() => setScreen("success")} />;
  }

  if (screen === "processing") {
    return <ProcessingScreen productName={displayTitle} productPrice={displayPrice} />;
  }

  if (screen === "success") {
    return (
      <SuccessScreen
        merchantName={merchantName}
        productName={displayTitle}
        productPrice={displayPrice}
        orderId={orderId}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col px-6 pb-7 animate-fade-up">
      <SecuredHeader />
      <div className="flex flex-col items-center gap-1.5 py-1.5 text-center">
        <div className="flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-full border border-line bg-white">
          <Storefront className="text-2xl text-muted" />
        </div>
        <p className="mt-1.5 text-[13.5px] text-muted">
          Paying <span className="font-semibold text-ink">{merchantName}</span>
        </p>
        <p className="text-[15.5px] font-semibold text-ink">{displayTitle}</p>
        <p className="font-display mt-1 text-[40px] font-extrabold tracking-tight text-ink">
          {displayPrice} <span className="text-[17px] font-semibold text-muted">USDC</span>
        </p>
      </div>

      <div className="mt-[18px] flex flex-col items-center gap-3 rounded-[22px] border border-line bg-white p-[26px] shadow-[0_6px_24px_rgba(21,22,27,0.05)]">
        <QRCodeSVG value={isDemo ? "https://lunas.app/demo" : address!} size={200} />
        <p className="text-center text-[13.5px] text-muted">Scan with your payment app</p>
      </div>

      {waTarget && (
        <div className="mt-3.5 flex items-center justify-center gap-1.5 text-[12.5px] text-muted">
          <WhatsappLogo className="text-base" />
          Questions? Message {merchantName}
        </div>
      )}

      <div className="flex-1" />

      {isDemo && (
        <button
          onClick={simulatePay}
          className="h-12 rounded-[13px] border-[1.5px] border-dashed border-primary/35 text-[13.5px] font-semibold text-primary transition-colors hover:bg-primary/5 active:scale-[.97]"
        >
          ▶ Demo: simulate a payment
        </button>
      )}
    </div>
  );
}

function ProcessingScreen({ productName, productPrice }: { productName: string; productPrice: string }) {
  return (
    <div className="flex min-h-screen flex-col px-6 pb-7 animate-fade-in">
      <SecuredHeader />
      <div className="flex flex-1 flex-col items-center justify-center gap-[26px] text-center">
        <div className="relative flex h-[180px] w-[180px] items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-primary/10" style={{ animation: "ripple 2s ease-out infinite" }} />
          <span className="absolute inset-0 rounded-full bg-primary/10" style={{ animation: "ripple 2s ease-out .7s infinite" }} />
          <span className="absolute inset-0 rounded-full bg-primary/10" style={{ animation: "ripple 2s ease-out 1.4s infinite" }} />
          <div className="animate-breathe flex h-[104px] w-[104px] items-center justify-center rounded-full border border-line bg-white shadow-[0_10px_30px_rgba(47,42,107,0.14)]">
            <Image src="/icon.png" alt="" width={56} height={56} />
          </div>
        </div>
        <div>
          <p className="font-display mb-1.5 text-2xl font-extrabold tracking-tight text-ink">
            Listening for your payment
          </p>
          <p className="inline-flex items-center gap-1.5 text-sm text-muted">
            Usually under ten seconds
            <span className="flex gap-[3px]">
              <span className="dot-blink h-1 w-1 rounded-full bg-muted" />
              <span className="dot-blink h-1 w-1 rounded-full bg-muted" style={{ animationDelay: ".2s" }} />
              <span className="dot-blink h-1 w-1 rounded-full bg-muted" style={{ animationDelay: ".4s" }} />
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-[18px] py-3">
          <span className="text-[13px] text-muted">{productName}</span>
          <span className="font-display text-[14.5px] font-bold text-ink">{productPrice} USDC</span>
        </div>
      </div>
      <p className="text-center text-xs text-muted">Keep this page open — it updates automatically.</p>
    </div>
  );
}

function SuccessScreen({
  merchantName,
  productName,
  productPrice,
  orderId,
}: {
  merchantName: string;
  productName: string;
  productPrice: string;
  orderId: string | null;
}) {
  const receipt = orderId ? `#LNS-${orderId.slice(2, 6).toUpperCase()}` : "#LNS-4127";

  return (
    <div className="flex min-h-screen flex-col px-6 pb-7 animate-fade-in">
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
          <p className="font-display text-[38px] font-extrabold tracking-tight text-success">Lunas ✓</p>
          <p className="mt-2 text-[14.5px] text-muted">Paid in full. You&apos;re all set.</p>
        </div>
        <div
          className="w-full max-w-[320px] rounded-2xl border border-line bg-white p-[22px] shadow-[0_6px_24px_rgba(21,22,27,0.05)] animate-fade-up"
          style={{ animationDelay: ".65s" }}
        >
          <Row label="Paid to" value={merchantName} />
          <Row label="For" value={productName} />
          <Row label="Amount" value={`${productPrice} USDC`} mono />
          <div className="mt-1.5 flex justify-between border-t border-dashed border-line pt-2.5 text-[13.5px]">
            <span className="text-muted">Receipt</span>
            <span className="font-semibold text-primary">{receipt}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2.5 animate-fade-up" style={{ animationDelay: ".8s" }}>
        <a
          href="/dashboard"
          className="flex h-[52px] items-center justify-center rounded-2xl bg-primary text-[15.5px] font-semibold text-white transition-transform active:scale-[.97]"
        >
          Done
        </a>
        <button className="h-11 rounded-xl text-sm font-medium text-muted transition-colors hover:bg-black/[.04]">
          Share receipt
        </button>
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

function ExpiredScreen({ waTarget }: { waTarget: string | null }) {
  return (
    <div className="flex min-h-screen flex-col px-6 pb-7 animate-fade-up">
      <SecuredHeader />
      <div className="flex flex-1 flex-col items-center justify-center gap-[18px] text-center">
        <div className="relative h-[110px] w-[110px]">
          <div className="absolute inset-0 rounded-full border-[1.5px] border-dashed border-black/[.16]" />
          <div className="absolute inset-3.5 flex items-center justify-center rounded-full border border-line bg-white">
            <Image src="/icon.png" alt="" width={44} height={44} className="opacity-55 grayscale" />
          </div>
        </div>
        <div>
          <p className="font-display mb-1.5 text-2xl font-extrabold tracking-tight text-ink">
            This link has expired
          </p>
          <p className="max-w-[260px] text-sm leading-relaxed text-muted">
            Payment links are single-use for your safety. Ask the seller to send a fresh one.
          </p>
        </div>
        {waTarget && (
          <a
            href={`https://wa.me/${waTarget}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[46px] items-center gap-2 rounded-[13px] border border-line bg-white px-[22px] text-sm font-semibold text-ink transition-transform active:scale-95"
          >
            <WhatsappLogo weight="fill" className="text-lg text-success" />
            Message the seller
          </a>
        )}
      </div>
    </div>
  );
}

function AlreadyPaidScreen({ merchantName, onView }: { merchantName: string; onView: () => void }) {
  return (
    <div className="flex min-h-screen flex-col px-6 pb-7 animate-fade-up">
      <SecuredHeader />
      <div className="flex flex-1 flex-col items-center justify-center gap-[18px] text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-success/10">
          <CheckCircle weight="fill" className="text-[46px] text-success" />
        </div>
        <div>
          <p className="font-display mb-1.5 text-2xl font-extrabold tracking-tight text-ink">
            Already paid — Lunas ✓
          </p>
          <p className="max-w-[270px] text-sm leading-relaxed text-muted">
            This order with {merchantName} was already settled. No further payment is needed.
          </p>
        </div>
        <button
          onClick={onView}
          className="flex h-[46px] items-center rounded-[13px] border border-line bg-white px-[22px] text-sm font-semibold text-ink transition-transform active:scale-95"
        >
          View receipt
        </button>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Frame>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <p className="text-muted">Loading...</p>
          </div>
        }
      >
        <CheckoutContent />
      </Suspense>
    </Frame>
  );
}
