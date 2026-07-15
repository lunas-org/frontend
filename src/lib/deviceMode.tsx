"use client";

// Desktop vs mobile mode. Real users get this for free — Frame's width tracks the viewport via
// plain responsive classes, no JS involved. This context exists only so a dev can force one mode
// while building, without physically resizing the browser: the override is applied as an explicit
// width on Frame (see Frame.tsx), and every `@md:`/`@lg:` container-query class elsewhere in the
// app is keyed off that width, so forcing Frame is enough to flip the whole app's layout branch.

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type DeviceMode = "mobile" | "desktop";
type Override = DeviceMode | null;

const LS_KEY = "lunas:deviceModeOverride";

type Ctx = {
  mode: DeviceMode;
  override: Override;
  setOverride: (m: Override) => void;
};

const DeviceModeContext = createContext<Ctx>({
  mode: "mobile",
  override: null,
  setOverride: () => {},
});

function readViewportMode(): DeviceMode {
  if (typeof window === "undefined") return "mobile";
  return window.matchMedia("(min-width: 768px)").matches ? "desktop" : "mobile";
}

export function DeviceModeProvider({ children }: { children: React.ReactNode }) {
  const [override, setOverrideState] = useState<Override>(null);
  const [viewportMode, setViewportMode] = useState<DeviceMode>("mobile");

  useEffect(() => {
    setViewportMode(readViewportMode());

    if (process.env.NODE_ENV === "development") {
      try {
        const saved = localStorage.getItem(LS_KEY);
        if (saved === "mobile" || saved === "desktop") setOverrideState(saved);
      } catch {
        // localStorage unavailable — no saved override
      }
    }

    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => setViewportMode(mq.matches ? "desktop" : "mobile");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setOverride = useCallback((m: Override) => {
    if (process.env.NODE_ENV !== "development") return;
    setOverrideState(m);
    try {
      if (m) localStorage.setItem(LS_KEY, m);
      else localStorage.removeItem(LS_KEY);
    } catch {
      // localStorage unavailable — keep in-memory only
    }
  }, []);

  return (
    <DeviceModeContext.Provider value={{ mode: override ?? viewportMode, override, setOverride }}>
      {children}
    </DeviceModeContext.Provider>
  );
}

export function useDeviceMode() {
  return useContext(DeviceModeContext);
}
