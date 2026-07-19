"use client";

// Settings — new screen from the Claude Design mockup (screen 07): edit profile inline, list
// of products, log out. Reachable from the dashboard avatar button and the bottom nav.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Tag, CaretRight, SignOut } from "@phosphor-icons/react/dist/ssr";
import { isLoggedIn, logout } from "@/lib/magic";
import { listProducts, listOrders, getProfile, saveProfile, type Product } from "@/lib/store";
import { toast } from "@/components/Toast";
import { useI18n } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useGuardedNav } from "@/lib/useGuardedNav";

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { go, pending: navPending } = useGuardedNav();
  const [products, setProducts] = useState<Product[]>([]);
  const [paidCounts, setPaidCounts] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [wa, setWa] = useState("");
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
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
      const profile = getProfile();
      if (profile) {
        setName(profile.displayName ?? "");
        setWa(profile.waNumber ?? "");
        setAvatar(profile.avatarDataUrl);
      }
      const ps = listProducts();
      const orders = listOrders();
      const counts: Record<string, number> = {};
      for (const o of orders) {
        if (o.status === "paid") counts[o.productId] = (counts[o.productId] ?? 0) + 1;
      }
      setProducts(ps);
      setPaidCounts(counts);
    })();
  }, [router]);

  function persist(patch: Partial<{ displayName: string; waNumber: string; avatarDataUrl: string }>) {
    const current = getProfile() ?? { displayName: "" };
    saveProfile({ ...current, ...patch });
    toast(t("toast.profileUpdated"));
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAvatar(dataUrl);
      persist({ avatarDataUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  }

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    await logout();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen px-6 pb-[92px] @md:pb-10">
        <div className="flex items-center justify-between py-3.5 @lg:mx-auto @lg:max-w-[560px]">
          <h1 className="font-display text-[22px] font-extrabold tracking-tight text-ink">{t("settings.title")}</h1>
          <LanguageToggle />
        </div>

        <div className="mt-2 flex items-center gap-4 rounded-[18px] glass-card p-[18px] @lg:mx-auto @lg:max-w-[560px]">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex h-[58px] w-[58px] flex-none items-center justify-center overflow-hidden rounded-full border-[1.5px] border-dashed border-primary/30 bg-primary/5 transition-transform active:scale-95"
          >
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" width={58} height={58} className="h-full w-full object-cover" />
            ) : (
              <Camera className="text-xl text-primary" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => persist({ displayName: name.trim() })}
              placeholder={t("settings.businessName")}
              className="font-display -ml-2.5 h-10 w-full rounded-[10px] border-[1.5px] border-transparent bg-transparent px-2.5 text-base font-bold text-ink transition-colors focus:border-primary focus:bg-white focus:outline-none"
            />
            <p className="text-[12.5px] text-muted">{t("settings.editHint")}</p>
          </div>
        </div>

        <div className="mt-3.5 flex flex-col gap-1.5 rounded-[18px] glass-card p-[18px] @lg:mx-auto @lg:max-w-[560px]">
          <label className="text-[13px] font-semibold text-ink">
            {t("profile.waLabel")} <span className="font-normal text-muted">· {t("profile.optional")}</span>
          </label>
          <input
            value={wa}
            onChange={(e) => setWa(e.target.value)}
            onBlur={() => persist({ waNumber: wa.trim() })}
            placeholder={t("profile.waPlaceholder")}
            className="h-11 rounded-xl border-[1.5px] border-line bg-white px-3 text-[14.5px] text-ink transition-shadow focus:border-primary focus:shadow-[0_0_0_3px_rgba(47,42,107,0.12)] focus:outline-none"
          />
        </div>

        <p className="mb-2.5 mt-[26px] text-xs font-semibold uppercase tracking-[.1em] text-muted @lg:mx-auto @lg:max-w-[560px]">{t("settings.yourProducts")}</p>
        <div className="flex flex-col gap-2.5 @lg:mx-auto @lg:max-w-[560px]">
          {products.length === 0 && <p className="text-sm text-muted">{t("settings.noProducts")}</p>}
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => go(`/products/${p.id}`)}
              disabled={navPending}
              className="flex w-full items-center gap-3.5 rounded-[15px] glass-card px-4 py-[15px] text-left transition-transform hover:border-primary/30 active:scale-[.98] disabled:pointer-events-none disabled:opacity-60"
            >
              <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl bg-primary/[.07]">
                <Tag className="text-[17px] text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{p.title}</p>
                <p className="mt-0.5 text-xs text-muted">{t("products.paidCount", { count: paidCounts[p.id] ?? 0 })}</p>
              </div>
              <span className="font-display whitespace-nowrap text-[14.5px] font-bold text-ink">${p.priceUsd}</span>
              <CaretRight className="text-[15px] text-muted" />
            </button>
          ))}
        </div>

        <p className="mb-2.5 mt-[26px] text-xs font-semibold uppercase tracking-[.1em] text-muted @lg:mx-auto @lg:max-w-[560px]">{t("settings.account")}</p>
        <button
          onClick={() => setConfirmLogout(true)}
          className="flex w-full items-center gap-3 rounded-[15px] glass-card px-4 py-[15px] text-sm font-semibold text-danger transition-transform active:scale-[.98] @lg:mx-auto @lg:max-w-[560px]"
        >
          <SignOut className="text-lg" />
          {t("settings.logout")}
        </button>

        {confirmLogout && (
          <div
            className="absolute inset-0 z-50 flex items-end justify-center bg-ink/30 backdrop-blur-[2px] animate-fade-in @md:left-[220px] @md:items-center"
            onClick={() => !loggingOut && setConfirmLogout(false)}
          >
            <div
              className="mb-4 w-[calc(100%-32px)] rounded-[24px] glass-card p-6 text-center @md:mb-0 @md:w-full @md:max-w-[380px]"
              style={{ animation: "fadeUp .3s cubic-bezier(.2,.7,.3,1) both" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-full bg-danger/10">
                <SignOut className="text-2xl text-danger" />
              </div>
              <p className="font-display text-xl font-extrabold tracking-tight text-ink">{t("settings.logoutTitle")}</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{t("settings.logoutDesc")}</p>
              <div className="mt-5 flex flex-col gap-2.5">
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-danger text-[15px] font-semibold text-white transition-transform active:scale-[.97] disabled:pointer-events-none disabled:opacity-70"
                >
                  {loggingOut && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                  {t("settings.logout")}
                </button>
                <button
                  onClick={() => setConfirmLogout(false)}
                  disabled={loggingOut}
                  className="h-11 w-full rounded-xl text-sm font-medium text-muted transition-colors hover:bg-black/[.04] disabled:pointer-events-none disabled:opacity-40"
                >
                  {t("settings.logoutCancel")}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
