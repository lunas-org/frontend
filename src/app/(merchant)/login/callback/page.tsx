"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { handleOAuthRedirect, getMagicProvider } from "@/lib/magic";
import { createSmartAccountFromProvider } from "@/lib/zerodev";
import { hasSeenProfileSetup } from "@/lib/store";
import { CalmLoader } from "@/components/CalmLoader";

type Status = "loading" | "error";

export default function LoginCallbackPage() {
  const router = useRouter();
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
        await createSmartAccountFromProvider(provider);
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
      {status === "loading" && <CalmLoader label="Setting up your account..." />}
      {status === "error" && <p className="text-sm text-red-600">Something went wrong: {error}</p>}
    </main>
  );
}
