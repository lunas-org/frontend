"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { handleOAuthRedirect, getMagicProvider } from "@/lib/magic";
import { createSmartAccountFromProvider } from "@/lib/zerodev";
import { hasSeenProfileSetup, setActiveAddress } from "@/lib/store";
import { CalmLoader } from "@/components/CalmLoader";
import { useI18n } from "@/lib/i18n";

type Status = "loading" | "error";

export default function LoginCallbackPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  // handleOAuthRedirect() consumes one-time PKCE session data — React 18 Strict Mode
  // double-invokes effects in dev, which would otherwise call it twice and fail with
  // MISSING_PKCE_METADATA on the second call. Guard so the body only truly runs once.
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    (async () => {
      try {
        await handleOAuthRedirect();
        const provider = getMagicProvider();
        const { address } = await createSmartAccountFromProvider(provider);
        // Scope the local store to this address BEFORE reading/writing anything else — this
        // is what stops a different Google account on the same browser from seeing the
        // previous account's cached products/orders/profile (see src/lib/store.ts).
        setActiveAddress(address);
        // This page is a one-shot OAuth redirect target — a refresh here has no PKCE
        // session left to consume. Move to a stable page immediately on success.
        router.replace(hasSeenProfileSetup() ? "/dashboard" : "/profile-setup");
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      }
    })();
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      {status === "loading" && <CalmLoader label={t("login.settingUp")} />}
      {status === "error" && <p className="text-sm text-red-600">{t("login.wentWrong")}: {error}</p>}
    </main>
  );
}
