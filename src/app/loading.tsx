"use client";

// Route-level loading UI — App Router shows this during a route segment's Suspense boundary
// (e.g. initial navigation before a page's data/effects settle). Mascot theme, calm tone.

import Image from "next/image";
import { Frame } from "@/components/Frame";
import { useI18n } from "@/lib/i18n";

export default function Loading() {
  const { t } = useI18n();
  return (
    <Frame>
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-8 text-center @lg:mx-auto @lg:max-w-[480px]">
        <Image src="/loading.png" alt="" width={160} height={160} className="animate-breathe" priority />
        <p className="inline-flex items-center gap-1.5 text-sm text-muted">
          {t("loadingPage.label")}
          <span className="flex gap-[3px]">
            <span className="dot-blink h-1 w-1 rounded-full bg-muted" />
            <span className="dot-blink h-1 w-1 rounded-full bg-muted" style={{ animationDelay: ".2s" }} />
            <span className="dot-blink h-1 w-1 rounded-full bg-muted" style={{ animationDelay: ".4s" }} />
          </span>
        </p>
      </div>
    </Frame>
  );
}
