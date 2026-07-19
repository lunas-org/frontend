"use client";

// Cash-out (withdraw) flow — REAL on-chain withdrawal. Sends USDC from the merchant's smart
// account to a destination address (e.g. their exchange's USDC deposit address on Arbitrum) via
// a real userOp (src/lib/zerodev.ts withdrawUsdc). Operating the smart account on mainnet goes
// through ZeroDev's bundler, which returns HTTP 402 "No Plan found" without a paid plan — so today
// clicking this surfaces that real 402 error (honest proof the integration works and would move
// funds the moment a plan is active). From the exchange, the merchant sells to rupiah and
// withdraws to their bank — that off-ramp is outside the app. See context/future-features.md.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, CheckCircle, WarningCircle, CaretDown } from "@phosphor-icons/react/dist/ssr";
import { isLoggedIn, getMagicProvider } from "@/lib/magic";
import { createSmartAccountFromProvider, getUsdcBalance, withdrawUsdc } from "@/lib/zerodev";
import { USD_TO_IDR } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { CalmLoader } from "@/components/CalmLoader";

type Screen = "form" | "processing" | "success" | "error";

function formatIdr(usd: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Math.round(usd * USD_TO_IDR));
}

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export default function WithdrawPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [ready, setReady] = useState(false);
  const [balance, setBalance] = useState(0);
  const [screen, setScreen] = useState<Screen>("form");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [to, setTo] = useState("");
  const [touchedAddr, setTouchedAddr] = useState(false);

  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    (async () => {
      if (!(await isLoggedIn())) {
        router.replace("/login");
        return;
      }
      try {
        const { address } = await createSmartAccountFromProvider(getMagicProvider());
        const bal = await getUsdcBalance(address);
        const n = bal ? parseFloat(bal) : 0;
        setBalance(n);
        if (n > 0) setAmount(n.toFixed(2));
      } catch {
        // leave balance at 0
      }
      setReady(true);
    })();
  }, [router]);

  const amountNum = parseFloat(amount) || 0;
  const addrValid = ADDRESS_RE.test(to.trim());
  const formValid = amountNum > 0 && amountNum <= balance && addrValid;

  async function submit() {
    if (!formValid) return;
    setScreen("processing");
    setError(null);
    try {
      // Real on-chain withdrawal — will 402 without a ZeroDev mainnet plan; that error is shown.
      const hash = await withdrawUsdc({
        provider: getMagicProvider(),
        to: to.trim() as `0x${string}`,
        amount,
      });
      setTxHash(hash);
      setScreen("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setScreen("error");
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <CalmLoader label={t("common.loading")} />
      </div>
    );
  }

  if (screen === "processing") {
    return (
      <div className="flex min-h-screen flex-col px-6 pb-7 @lg:mx-auto @lg:w-full @lg:max-w-[480px] animate-fade-in">
        <div className="flex flex-1 flex-col items-center justify-center gap-[26px] text-center">
          <div className="relative flex h-[180px] w-[180px] items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-primary/10" style={{ animation: "ripple 2s ease-out infinite" }} />
            <span className="absolute inset-0 rounded-full bg-primary/10" style={{ animation: "ripple 2s ease-out .7s infinite" }} />
            <Image src="/payment-processing.png" alt="" width={150} height={150} className="animate-breathe" />
          </div>
          <div>
            <p className="font-display mb-1.5 text-2xl font-extrabold tracking-tight text-ink">{t("withdraw.processingTitle")}</p>
            <p className="inline-flex items-center gap-1.5 text-sm text-muted">
              {t("withdraw.processingSub")}
              <span className="flex gap-[3px]">
                <span className="dot-blink h-1 w-1 rounded-full bg-muted" />
                <span className="dot-blink h-1 w-1 rounded-full bg-muted" style={{ animationDelay: ".2s" }} />
                <span className="dot-blink h-1 w-1 rounded-full bg-muted" style={{ animationDelay: ".4s" }} />
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "error") {
    return (
      <div className="flex min-h-screen flex-col px-6 pb-7 @lg:mx-auto @lg:w-full @lg:max-w-[480px] animate-fade-up">
        <div className="flex items-center gap-2 py-3.5">
          <button onClick={() => setScreen("form")} className="-ml-2.5 flex h-10 w-10 items-center justify-center rounded-xl hover:bg-black/5 active:scale-95">
            <ArrowLeft className="text-xl text-ink" />
          </button>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <div className="flex h-[92px] w-[92px] items-center justify-center rounded-full bg-danger/10">
            <WarningCircle weight="fill" className="text-[46px] text-danger" />
          </div>
          <div>
            <p className="font-display text-2xl font-extrabold tracking-tight text-ink">{t("withdraw.errorTitle")}</p>
            <p className="mt-2 max-w-[300px] text-sm leading-relaxed text-muted">{t("withdraw.errorNote")}</p>
          </div>
          {error && (
            <p className="w-full max-w-[360px] break-words rounded-xl bg-black/[.04] px-4 py-3 text-left font-mono text-[11.5px] leading-relaxed text-muted">
              {error}
            </p>
          )}
          <button
            onClick={() => setScreen("form")}
            className="h-[46px] rounded-2xl glass-btn px-6 text-sm font-semibold text-white transition-transform active:scale-95"
          >
            {t("withdraw.tryAgain")}
          </button>
        </div>
      </div>
    );
  }

  if (screen === "success") {
    const short = txHash ? `${txHash.slice(0, 8)}…${txHash.slice(-6)}` : "";
    return (
      <div className="flex min-h-screen flex-col px-6 pb-7 @lg:mx-auto @lg:w-full @lg:max-w-[480px] animate-fade-in">
        <div className="flex flex-1 flex-col items-center justify-center gap-[20px] pt-[26px] text-center">
          <div className="relative flex h-[130px] w-[130px] items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-success/[.18]" style={{ animation: "ripple 1.1s ease-out .15s both" }} />
            <div
              className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-success shadow-[0_14px_40px_rgba(31,157,120,0.35)]"
              style={{ animation: "popIn .5s cubic-bezier(.2,1.4,.4,1) both" }}
            >
              <svg width="50" height="50" viewBox="0 0 58 58" fill="none">
                <path d="M14 30.5 L25 41 L45 19" stroke="#fff" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 60, strokeDashoffset: 60, animation: "drawCheck .45s cubic-bezier(.4,0,.2,1) .3s forwards" }} />
              </svg>
            </div>
          </div>
          <div className="animate-fade-up" style={{ animationDelay: ".5s" }}>
            <p className="font-display text-[26px] font-extrabold tracking-tight text-success">{t("withdraw.successTitle")}</p>
            <p className="mt-1.5 max-w-[300px] text-[14px] text-muted">{t("withdraw.successSub", { amount: amountNum.toFixed(2) })}</p>
          </div>
          <div className="w-full max-w-[340px] rounded-2xl glass-card p-[20px] text-left shadow-[0_6px_24px_rgba(21,22,27,0.05)] animate-fade-up" style={{ animationDelay: ".65s" }}>
            <Row label={t("withdraw.receiptTo")} value={`${to.slice(0, 6)}…${to.slice(-4)}`} />
            <Row label={t("withdraw.receiptAmount")} value={`${amountNum.toFixed(2)} USDC`} mono />
            {short && (
              <div className="mt-1.5 flex justify-between border-t border-dashed border-line pt-2.5 text-[13.5px]">
                <span className="text-muted">{t("withdraw.receiptRef")}</span>
                <span className="font-mono text-[12px] font-semibold text-primary">{short}</span>
              </div>
            )}
          </div>
          <div className="w-full max-w-[340px] rounded-2xl border border-line bg-white p-[18px] text-left animate-fade-up" style={{ animationDelay: ".8s" }}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[.1em] text-muted">{t("withdraw.nextTitle")}</p>
            <Step n={1} text={t("withdraw.step1")} />
            <Step n={2} text={t("withdraw.step2")} />
            <p className="mt-3 text-[12px] text-muted">{t("withdraw.stepNote")}</p>
          </div>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-4 h-[52px] rounded-2xl glass-btn text-[15.5px] font-semibold text-white transition-transform active:scale-[.97] animate-fade-up"
          style={{ animationDelay: ".95s" }}
        >
          {t("withdraw.done")}
        </button>
      </div>
    );
  }

  // form
  return (
    <div className="flex min-h-screen flex-col px-6 pb-7 @lg:mx-auto @lg:w-full @lg:max-w-[480px]">
      <div className="flex items-center gap-2 py-3.5">
        <button onClick={() => router.push("/dashboard")} className="-ml-2.5 flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-black/5 active:scale-95">
          <ArrowLeft className="text-xl text-ink" />
        </button>
        <h1 className="font-display text-[22px] font-extrabold tracking-tight text-ink">{t("withdraw.title")}</h1>
      </div>

      <div className="glass-panel relative mt-1 overflow-hidden rounded-[20px] px-6 py-5">
        <p className="relative text-[12.5px] text-white/65">{t("withdraw.available")}</p>
        <p className="font-display relative mt-1 text-[30px] font-extrabold leading-none tracking-tight">
          {balance.toFixed(2)} <span className="text-sm font-semibold text-white/60">USDC</span>
        </p>
        <p className="relative mt-1.5 text-[12.5px] text-white/60">≈ {formatIdr(balance)}</p>
      </div>

      {balance <= 0 ? (
        <p className="mt-6 text-center text-sm text-muted">{t("withdraw.emptyBalance")}</p>
      ) : (
        <>
          <div className="mt-5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-semibold text-ink">{t("withdraw.amount")}</label>
              <button onClick={() => setAmount(balance.toFixed(2))} className="rounded-full bg-primary/[.07] px-2.5 py-0.5 text-[11.5px] font-semibold text-primary active:scale-95">
                {t("withdraw.max")}
              </button>
            </div>
            <div className="relative">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                inputMode="decimal"
                className="font-display h-[52px] w-full rounded-[13px] border-[1.5px] border-line bg-white px-4 pr-[72px] text-[15px] font-semibold text-ink transition-shadow focus:border-primary focus:shadow-[0_0_0_3px_rgba(47,42,107,0.12)] focus:outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13.5px] font-semibold text-muted">USDC</span>
            </div>
            {amountNum > 0 && <p className="text-[12px] text-muted">≈ {formatIdr(amountNum)}</p>}
          </div>

          <div className="mt-5 flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-ink">{t("withdraw.destination")}</label>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value.trim())}
              onBlur={() => setTouchedAddr(true)}
              placeholder={t("withdraw.addressPh")}
              className={`h-[52px] rounded-[13px] border-[1.5px] bg-white px-4 font-mono text-[13px] text-ink transition-shadow focus:shadow-[0_0_0_3px_rgba(47,42,107,0.12)] focus:outline-none ${
                touchedAddr && to && !addrValid ? "border-danger focus:border-danger" : "border-line focus:border-primary"
              }`}
            />
            {touchedAddr && to && !addrValid && (
              <p className="flex items-center gap-1.5 text-[12.5px] text-danger">
                <WarningCircle className="text-sm" />
                {t("withdraw.addressInvalid")}
              </p>
            )}
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-[13px] bg-primary/5 px-4 py-3.5">
            <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">i</span>
            <p className="text-[12.5px] leading-relaxed text-primary/90">{t("withdraw.flowHint")}</p>
          </div>

          <details className="group mt-3 rounded-[13px] border border-line bg-white px-4 py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between text-[13px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
              {t("withdraw.guideToggle")}
              <CaretDown className="text-sm text-muted transition-transform group-open:rotate-180" />
            </summary>
            <ol className="mt-3 flex flex-col gap-2">
              {[
                t("withdraw.guideStep1"),
                t("withdraw.guideStep2"),
                t("withdraw.guideStep3"),
                t("withdraw.guideStep4"),
                t("withdraw.guideStep5"),
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-muted">
                  <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-primary/[.08] text-[10px] font-bold text-primary">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-danger/[.06] px-3 py-2.5">
              <WarningCircle weight="fill" className="mt-0.5 flex-none text-[14px] text-danger" />
              <p className="text-[11.5px] leading-relaxed text-danger">{t("withdraw.guideWarn")}</p>
            </div>
          </details>

          <div className="flex-1" />

          <div className="mt-5 flex items-center justify-between rounded-2xl glass-card px-4 py-3">
            <span className="text-[13.5px] text-muted">{t("withdraw.youSend")}</span>
            <span className="font-display text-[15px] font-bold text-ink">{amountNum.toFixed(2)} USDC</span>
          </div>

          <button
            onClick={submit}
            disabled={!formValid}
            className="mt-3 flex h-[52px] items-center justify-center gap-2 rounded-2xl glass-btn text-[15.5px] font-semibold text-white transition-transform active:scale-[.97] disabled:opacity-45"
          >
            <CheckCircle weight="fill" className="text-lg" />
            {t("withdraw.submit")}
          </button>
        </>
      )}
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

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary/[.08] text-[12px] font-bold text-primary">{n}</span>
      <span className="text-[13.5px] text-ink">{text}</span>
    </div>
  );
}
