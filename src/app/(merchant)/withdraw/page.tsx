"use client";

// Cash-out (withdraw) flow — DEMO UI. Shows the merchant experience of cashing their USDC
// balance out to a local bank / e-wallet. The real off-ramp (USDC → IDR → bank) is a roadmap
// integration via an off-ramp provider (Transak/MoonPay-style) — and moving USDC out of the
// merchant's smart account needs a ZeroDev plan or an EOA redesign (see context/future-features.md
// and context/zerodev-sra.md). So this SIMULATES the flow end-to-end: no funds actually move.
// It exists so the "get paid → cash out" story is demoable and the UX is real to a judge.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Bank, CaretDown, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { isLoggedIn, getMagicProvider } from "@/lib/magic";
import { createSmartAccountFromProvider, getUsdcBalance } from "@/lib/zerodev";
import { USD_TO_IDR } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { CalmLoader } from "@/components/CalmLoader";

const BANKS = ["BCA", "Mandiri", "BNI", "BRI", "GoPay", "OVO", "DANA"];

type Screen = "form" | "processing" | "success";

function formatIdr(usd: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Math.round(usd * USD_TO_IDR));
}

export default function WithdrawPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [ready, setReady] = useState(false);
  const [balance, setBalance] = useState(0);
  const [screen, setScreen] = useState<Screen>("form");

  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const ranRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

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

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const amountNum = parseFloat(amount) || 0;
  const ref = `WD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const formValid =
    amountNum > 0 && amountNum <= balance && !!bank && accountNumber.trim().length >= 4 && !!accountName.trim();

  function submit() {
    if (!formValid) return;
    setScreen("processing");
    timerRef.current = setTimeout(() => setScreen("success"), 2600);
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
          <div className="flex items-center gap-3 rounded-2xl glass-card px-[18px] py-3">
            <span className="text-[13px] text-muted">{bank}</span>
            <span className="font-display text-[14.5px] font-bold text-ink">{formatIdr(amountNum)}</span>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "success") {
    return (
      <div className="flex min-h-screen flex-col px-6 pb-7 @lg:mx-auto @lg:w-full @lg:max-w-[480px] animate-fade-in">
        <div className="flex flex-1 flex-col items-center justify-center gap-[22px] pt-[26px] text-center">
          <div className="relative flex h-[150px] w-[150px] items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-success/[.18]" style={{ animation: "ripple 1.1s ease-out .15s both" }} />
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
                  style={{ strokeDasharray: 60, strokeDashoffset: 60, animation: "drawCheck .45s cubic-bezier(.4,0,.2,1) .3s forwards" }}
                />
              </svg>
            </div>
          </div>
          <div className="animate-fade-up" style={{ animationDelay: ".5s" }}>
            <p className="font-display text-[30px] font-extrabold tracking-tight text-success">{t("withdraw.successTitle")}</p>
            <p className="mt-2 max-w-[280px] text-[14.5px] text-muted">
              {t("withdraw.successSub", { amount: formatIdr(amountNum) })}
            </p>
          </div>
          <div className="w-full max-w-[320px] rounded-2xl glass-card p-[22px] shadow-[0_6px_24px_rgba(21,22,27,0.05)] animate-fade-up" style={{ animationDelay: ".65s" }}>
            <Row label={t("withdraw.receiptTo")} value={`${bank} ••••${accountNumber.slice(-4)}`} />
            <Row label={t("withdraw.receiptAmount")} value={formatIdr(amountNum)} mono />
            <div className="mt-1.5 flex justify-between border-t border-dashed border-line pt-2.5 text-[13.5px]">
              <span className="text-muted">{t("withdraw.receiptRef")}</span>
              <span className="font-semibold text-primary">{ref}</span>
            </div>
          </div>
          <p className="text-[12px] text-muted">{t("withdraw.arrivalNote")}</p>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="h-[52px] rounded-2xl glass-btn text-[15.5px] font-semibold text-white transition-transform active:scale-[.97] animate-fade-up"
          style={{ animationDelay: ".8s" }}
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
        <button
          onClick={() => router.push("/dashboard")}
          className="-ml-2.5 flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-black/5 active:scale-95"
        >
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
              <button
                onClick={() => setAmount(balance.toFixed(2))}
                className="rounded-full bg-primary/[.07] px-2.5 py-0.5 text-[11.5px] font-semibold text-primary active:scale-95"
              >
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

          <p className="mb-2.5 mt-6 text-xs font-semibold uppercase tracking-[.1em] text-muted">{t("withdraw.destination")}</p>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-ink">{t("withdraw.bank")}</label>
              <div className="relative">
                <Bank className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[18px] text-muted" />
                <select
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  className={`h-[52px] w-full appearance-none rounded-[13px] border-[1.5px] border-line bg-white pl-11 pr-10 text-[15px] transition-shadow focus:border-primary focus:shadow-[0_0_0_3px_rgba(47,42,107,0.12)] focus:outline-none ${
                    bank ? "text-ink" : "text-muted"
                  }`}
                >
                  <option value="">{t("withdraw.selectBank")}</option>
                  {BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <CaretDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[15px] text-muted" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-ink">{t("withdraw.accountNumber")}</label>
              <input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                placeholder={t("withdraw.accountNumberPh")}
                className="h-[52px] rounded-[13px] border-[1.5px] border-line bg-white px-4 text-[15px] text-ink transition-shadow focus:border-primary focus:shadow-[0_0_0_3px_rgba(47,42,107,0.12)] focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-ink">{t("withdraw.accountName")}</label>
              <input
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder={t("withdraw.accountNamePh")}
                className="h-[52px] rounded-[13px] border-[1.5px] border-line bg-white px-4 text-[15px] text-ink transition-shadow focus:border-primary focus:shadow-[0_0_0_3px_rgba(47,42,107,0.12)] focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 rounded-2xl glass-card p-4">
            <div className="flex justify-between text-[13.5px]">
              <span className="text-muted">{t("withdraw.fee")}</span>
              <span className="font-semibold text-success">{t("withdraw.free")}</span>
            </div>
            <div className="flex justify-between border-t border-dashed border-line pt-2 text-[13.5px]">
              <span className="text-muted">{t("withdraw.youReceive")}</span>
              <span className="font-display font-bold text-ink">{formatIdr(amountNum)}</span>
            </div>
          </div>

          <div className="flex-1" />

          <button
            onClick={submit}
            disabled={!formValid}
            className="mt-5 flex h-[52px] items-center justify-center gap-2 rounded-2xl glass-btn text-[15.5px] font-semibold text-white transition-transform active:scale-[.97] disabled:opacity-45"
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
