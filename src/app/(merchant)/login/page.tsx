"use client";

// Login — CLAUDE.md §9 screen 1: one button, "Continue with Google". Nothing else.
// Mirrors the Claude Design mockup's screen 02 (lunasui/Lunas App standalone src.html).

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { loginWithGoogle } from "@/lib/magic";
import { useI18n } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path fill="#4285F4" d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.4a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.9-1.75 2.97-4.32 2.97-7.31Z" />
      <path fill="#34A853" d="M10 20c2.7 0 4.96-.9 6.63-2.44l-3.23-2.5c-.9.6-2.05.96-3.4.96-2.6 0-4.8-1.76-5.6-4.12H1.06v2.59A10 10 0 0 0 10 20Z" />
      <path fill="#FBBC05" d="M4.4 11.9a6 6 0 0 1 0-3.8V5.51H1.06a10 10 0 0 0 0 8.98L4.4 11.9Z" />
      <path fill="#EA4335" d="M10 3.98c1.47 0 2.8.5 3.84 1.5l2.87-2.87A9.96 9.96 0 0 0 10 0 10 10 0 0 0 1.06 5.51L4.4 8.1C5.2 5.74 7.4 3.98 10 3.98Z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [goingBack, setGoingBack] = useState(false);

  function handleBack() {
    if (goingBack || loading) return;
    setGoingBack(true);
    router.push("/");
  }

  async function handleLogin() {
    setError(null);
    setLoading(true);
    try {
      const redirectURI = `${window.location.origin}/login/callback`;
      await loginWithGoogle(redirectURI);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  }

  return (
      <div className="flex min-h-screen flex-col">
        <div className="flex items-center justify-between p-3.5">
          <button
            onClick={handleBack}
            disabled={loading || goingBack}
            className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-black/5 active:scale-[.94] disabled:pointer-events-none disabled:opacity-40"
            aria-label={t("common.back")}
          >
            <ArrowLeft className="text-xl text-ink" />
          </button>
          <div className={loading || goingBack ? "pointer-events-none opacity-40" : undefined}>
            <LanguageToggle />
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-7 pb-20 text-center">
          <Image src="/icon.png" alt="Lunas" width={72} height={72} />
          <div>
            <h1 className="font-display mb-2 text-[30px] font-extrabold tracking-tight text-ink">
              {t("login.welcome")}
            </h1>
            <p className="text-[14.5px] leading-relaxed text-muted">{t("login.subtitle")}</p>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading || goingBack}
            className="flex h-[54px] w-full max-w-[320px] items-center justify-center gap-3 rounded-2xl glass-card text-[15.5px] font-semibold text-ink shadow-[0_2px_8px_rgba(21,22,27,0.05)] transition-transform active:scale-[.97] disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <Image src="/icon.png" alt="" width={22} height={22} className="animate-breathe" style={{ animationDuration: "1s" }} />
                <span className="text-muted">{t("login.signingIn")}</span>
                <span className="flex gap-[3px]">
                  <span className="dot-blink h-1 w-1 rounded-full bg-muted" />
                  <span className="dot-blink h-1 w-1 rounded-full bg-muted" style={{ animationDelay: ".2s" }} />
                  <span className="dot-blink h-1 w-1 rounded-full bg-muted" style={{ animationDelay: ".4s" }} />
                </span>
              </>
            ) : (
              <>
                <GoogleIcon />
                {t("login.google")}
              </>
            )}
          </button>

          {error && <p className="text-sm text-danger">{error}</p>}

          <p className="max-w-[280px] text-xs leading-relaxed text-muted">{t("login.terms")}</p>
        </div>
      </div>
  );
}
