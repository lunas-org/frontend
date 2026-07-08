// 404 — App Router catch-all for unknown URLs. Keeps the mascot theme and calm tone; no
// wallet/chain/crypto language (buyer-safe), since a mistyped payment link lands here too.

import Link from "next/link";
import Image from "next/image";
import { Frame } from "@/components/Frame";

export default function NotFound() {
  return (
    <Frame>
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-8 text-center animate-fade-up">
        <Image src="/404.png" alt="" width={190} height={190} className="animate-float" priority />
        <div>
          <p className="font-display text-[26px] font-extrabold tracking-tight text-ink">
            This page wandered off
          </p>
          <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-muted">
            The link may be broken or the page may have moved. Let&apos;s get you back on track.
          </p>
        </div>
        <Link
          href="/"
          className="flex h-[50px] items-center rounded-2xl bg-primary px-7 text-[15px] font-semibold text-white transition-transform active:scale-[.97]"
        >
          Take me home
        </Link>
      </div>
    </Frame>
  );
}
