"use client";

// Global error boundary — App Router renders this when a route throws (network drop, RPC
// failure, unexpected state). `reset()` re-attempts the failed render. Must be a client
// component per Next.js. Buyer-safe copy; no crypto/chain language.

import { useEffect } from "react";
import Image from "next/image";
import { Frame } from "@/components/Frame";
import { useI18n } from "@/lib/i18n";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  useEffect(() => {
    // Surface for debugging; a real logger would go here.
    console.error(error);
  }, [error]);

  return (
    <Frame>
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-8 text-center animate-fade-up">
        <Image src="/network-error.png" alt="" width={190} height={190} className="animate-float" />
        <div>
          <p className="font-display text-[26px] font-extrabold tracking-tight text-ink">{t("error.title")}</p>
          <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-muted">{t("error.desc")}</p>
        </div>
        <button
          onClick={reset}
          className="flex h-[50px] items-center rounded-2xl glass-btn px-7 text-[15px] font-semibold text-white transition-transform active:scale-[.97]"
        >
          {t("common.tryAgain")}
        </button>
      </div>
    </Frame>
  );
}
