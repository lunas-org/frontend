"use client";

// Offline banner — a slim top bar shown whenever the browser loses connectivity. Payments and
// balances depend on the network, so a silent offline state would look like the app is broken.
// Mounted once in the root layout so it covers every screen (buyer and merchant).

import { useEffect, useState } from "react";
import { WifiSlash } from "@phosphor-icons/react/dist/ssr";
import { useI18n } from "@/lib/i18n";

export function OfflineBanner() {
  const { t } = useI18n();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] flex justify-center">
      <div
        className="flex w-full max-w-[430px] items-center justify-center gap-2 bg-ink px-4 py-2 text-[12.5px] font-semibold text-white"
        style={{ paddingTop: "calc(8px + env(safe-area-inset-top))" }}
      >
        <WifiSlash weight="bold" className="text-[15px]" />
        {t("offline.message")}
      </div>
    </div>
  );
}
