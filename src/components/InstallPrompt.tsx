"use client";

// "Add to home screen" prompt — merchants use Lunas like an app, and it's an installable PWA
// (manifest + maskable icon are set up). Chromium fires `beforeinstallprompt`; we capture it,
// show our own on-brand banner, and call prompt() on tap. Dismissal is remembered so it never
// nags. iOS Safari doesn't fire the event (no programmatic install), so this simply won't show
// there — acceptable. Mounted in the merchant layout only, so buyers never see it mid-checkout.

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, DownloadSimple } from "@phosphor-icons/react/dist/ssr";

const DISMISS_KEY = "lunas:install-dismissed";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    dismiss();
  }

  if (!show) return null;

  return (
    <div className="absolute inset-x-0 bottom-[76px] z-40 flex justify-center px-4">
      <div
        className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 shadow-[0_10px_30px_rgba(21,22,27,0.12)]"
        style={{ animation: "fadeUp .3s cubic-bezier(.2,.7,.3,1) both" }}
      >
        <Image src="/icon.png" alt="" width={36} height={36} className="flex-none" />
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold text-ink">Add Lunas to your home screen</p>
          <p className="text-[12px] text-muted">Open it like an app, one tap away.</p>
        </div>
        <button
          onClick={install}
          className="flex h-9 flex-none items-center gap-1.5 rounded-xl bg-primary px-3.5 text-[13px] font-semibold text-white transition-transform active:scale-95"
        >
          <DownloadSimple weight="bold" className="text-[15px]" />
          Add
        </button>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-muted transition-colors hover:bg-black/5 active:scale-95"
        >
          <X className="text-base" />
        </button>
      </div>
    </div>
  );
}
