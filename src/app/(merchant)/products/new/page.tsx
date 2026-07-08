"use client";

// "Create product" — CLAUDE.md §9 screen 3, redesigned per the Claude Design mockup (screen
// 05): validated inputs, a live "Buyers will see" preview card, breathing-icon submit state.
// Creates a Smart Routing Address whose action calls fulfillOrder(orderId, merchant,
// FLEX.AMOUNT) on Checkout.sol, forwarding to the logged-in merchant's own wallet.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { arbitrum } from "viem/chains";
import { ArrowLeft, Tag, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { isLoggedIn, getMagicProvider } from "@/lib/magic";
import { createSmartAccountFromProvider, createProductPaymentAddress, generateOrderId } from "@/lib/zerodev";
import { saveProduct, saveOrder, getProfile } from "@/lib/store";
import { CalmLoader } from "@/components/CalmLoader";
import { idrEstimate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

type Status = "checking" | "form" | "creating" | "error";

export default function NewProductPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState<string | null>(null);
  const [merchant, setMerchant] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");

  const [title, setTitle] = useState("");
  const [priceUsd, setPriceUsd] = useState("");
  const [touchedName, setTouchedName] = useState(false);
  const [touchedPrice, setTouchedPrice] = useState(false);

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
      const provider = getMagicProvider();
      const { address } = await createSmartAccountFromProvider(provider);
      setMerchant(address);
      const profile = getProfile();
      if (profile?.displayName) setDisplayName(profile.displayName);
      setStatus("form");
    })();
  }, [router]);

  const price = parseFloat(priceUsd);
  const nameError = touchedName && !title.trim();
  const priceError = touchedPrice && !(price > 0);
  const formValid = !!title.trim() && price > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!merchant) return;
    if (!formValid) {
      setTouchedName(true);
      setTouchedPrice(true);
      return;
    }

    const checkoutAddress = process.env.NEXT_PUBLIC_CHECKOUT_CONTRACT_ADDRESS_MAINNET as
      | `0x${string}`
      | undefined;
    if (!checkoutAddress) {
      setError(
        "Checkout.sol hasn't been deployed to Arbitrum One (mainnet) yet. SRA needs a real mainnet contract address — deploy it first, then set NEXT_PUBLIC_CHECKOUT_CONTRACT_ADDRESS_MAINNET."
      );
      setStatus("error");
      return;
    }

    setStatus("creating");
    setError(null);

    try {
      const orderId = generateOrderId();
      const sraAddress = await createProductPaymentAddress({
        orderId,
        merchant: merchant as `0x${string}`,
        checkoutAddress,
      });

      const productId = crypto.randomUUID();
      saveProduct({
        id: productId,
        merchant: merchant as `0x${string}`,
        title: title.trim(),
        priceUsd,
        createdAt: Date.now(),
      });
      saveOrder({
        id: orderId,
        productId,
        sraAddress,
        checkoutAddress,
        chainId: arbitrum.id,
        status: "pending",
        createdAt: Date.now(),
      });

      router.push(`/products/${productId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <CalmLoader label={t("common.loading")} />
      </div>
    );
  }

  return (
      <form onSubmit={handleSubmit} className="flex min-h-screen flex-col px-6 pb-6 animate-fade-up">
        <div className="flex items-center gap-2 py-3.5">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="-ml-2.5 flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-black/5 active:scale-95"
          >
            <ArrowLeft className="text-xl text-ink" />
          </button>
          <h1 className="font-display text-[22px] font-extrabold tracking-tight text-ink">{t("newProduct.title")}</h1>
        </div>

        <div className="flex flex-col gap-[18px] pt-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-ink">{t("newProduct.nameLabel")}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setTouchedName(true)}
              placeholder={t("newProduct.namePlaceholder")}
              className={`h-[52px] rounded-[13px] border-[1.5px] bg-white px-4 text-[15px] text-ink transition-shadow focus:shadow-[0_0_0_3px_rgba(47,42,107,0.12)] focus:outline-none ${
                nameError ? "border-danger focus:border-danger" : "border-line focus:border-primary"
              }`}
            />
            {nameError && (
              <p className="flex items-center gap-1.5 text-[12.5px] text-danger">
                <WarningCircle className="text-sm" />
                {t("newProduct.nameError")}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-ink">{t("newProduct.priceLabel")}</label>
            <div className="relative">
              <input
                value={priceUsd}
                onChange={(e) => setPriceUsd(e.target.value.replace(/[^0-9.]/g, ""))}
                onBlur={() => setTouchedPrice(true)}
                placeholder="0.00"
                inputMode="decimal"
                className={`font-display h-[52px] w-full rounded-[13px] border-[1.5px] bg-white px-4 pr-[72px] text-[15px] font-semibold text-ink transition-shadow focus:shadow-[0_0_0_3px_rgba(47,42,107,0.12)] focus:outline-none ${
                  priceError ? "border-danger focus:border-danger" : "border-line focus:border-primary"
                }`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13.5px] font-semibold text-muted">USDC</span>
            </div>
            {priceError && (
              <p className="flex items-center gap-1.5 text-[12.5px] text-danger">
                <WarningCircle className="text-sm" />
                {t("newProduct.priceError")}
              </p>
            )}
          </div>
        </div>

        <div className="mt-[26px]">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-[.1em] text-muted">{t("newProduct.buyersSee")}</p>
          <div className="flex items-center gap-3.5 rounded-[18px] border border-line bg-white p-5 shadow-[0_4px_16px_rgba(21,22,27,0.04)]">
            <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-primary/[.07]">
              <Tag className="text-xl text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted">{t("newProduct.payingName", { name: displayName || t("profile.defaultBusiness") })}</p>
              <p className="mt-0.5 truncate text-[15px] font-semibold text-ink">{title.trim() || t("newProduct.yourProduct")}</p>
            </div>
            <div className="text-right">
              <p className="font-display whitespace-nowrap text-lg font-extrabold text-ink">
                {(price > 0 ? price.toFixed(2) : "0.00")} <span className="text-[11px] font-semibold text-muted">USDC</span>
              </p>
              {idrEstimate(price) && (
                <p className="whitespace-nowrap text-[11px] font-medium text-muted">{idrEstimate(price)}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1" />

        {status === "error" && <p className="mb-3 text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={!formValid || status === "creating"}
          className="flex h-[52px] items-center justify-center gap-2.5 rounded-2xl bg-primary text-[15.5px] font-semibold text-white transition-transform active:scale-[.97] disabled:opacity-45"
        >
          {status === "creating" && (
            <Image src="/icon.png" alt="" width={22} height={22} className="animate-breathe brightness-[4]" style={{ animationDuration: ".9s" }} />
          )}
          {status === "creating" ? t("newProduct.creating") : t("newProduct.create")}
        </button>
      </form>
  );
}
