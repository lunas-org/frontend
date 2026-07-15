"use client";

// Shared page shell — centers a device-width "card" on a soft background, wrapped in a CSS
// container (`@container`) so screens can branch structural layout (sidebar vs bottom nav,
// 1-col vs 2-col) with `@md:`/`@lg:` classes keyed off the card's own rendered width rather than
// the window's. On a real phone this stays phone-width; on a real desktop it widens on its own via
// `md:`/`lg:` — no JS needed. `forcedWidth` only kicks in when a dev picks Mobile/Desktop in the
// DevHud switch, so the other mode can be previewed without resizing the actual browser window.

import { useDeviceMode } from "@/lib/deviceMode";

export function Frame({ children }: { children: React.ReactNode }) {
  const { mode, override } = useDeviceMode();
  const forcedWidth = override ? (mode === "desktop" ? "1180px" : "430px") : undefined;

  return (
    <div className="flex min-h-screen justify-center bg-[#EEECE6]">
      <div
        className="@container relative min-h-screen w-full max-w-[430px] overflow-hidden bg-paper shadow-[0_24px_80px_rgba(21,22,27,0.10)] md:max-w-[1180px]"
        style={forcedWidth ? { maxWidth: forcedWidth } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
