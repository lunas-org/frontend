"use client";

// Shared nav-transition state for the merchant tab shell (BottomNav + Sidebar + the full-page
// loading overlay in MerchantLayout). Must be a single shared instance, not one hook call per
// component — otherwise Sidebar and BottomNav each track their own pending tap, and the overlay
// (which needs to know "is *any* nav transition in flight") has nothing to read.
//
// `navigate` no-ops a tap on the already-active route or while another nav transition is still
// pending, so rapid re-tapping across tabs can't queue overlapping route swaps or leave other page
// controls (e.g. Products' "+ New" button) clickable mid-transition — the overlay covers those.
//
// React's own transition-pending flag resolves in single-digit ms once a route is compiled — too
// fast to actually see. MIN_VISIBLE_MS floors how long `pendingHref` stays set so the loading cue
// always reads as intentional, while a genuinely slow transition still shows for its real duration.

import { createContext, useContext, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

const MIN_VISIBLE_MS = 450;

type NavTransitionValue = {
  pathname: string;
  isPending: boolean;
  pendingHref: string | null;
  navigate: (e: React.MouseEvent, href: string) => void;
};

const NavTransitionContext = createContext<NavTransitionValue | null>(null);

export function NavTransitionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isTransitionPending, startTransition] = useTransition();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const startedAtRef = useRef(0);

  useEffect(() => {
    if (isTransitionPending || pendingHref === null) return;
    const remaining = MIN_VISIBLE_MS - (Date.now() - startedAtRef.current);
    const timer = setTimeout(() => setPendingHref(null), Math.max(0, remaining));
    return () => clearTimeout(timer);
  }, [isTransitionPending, pendingHref]);

  function navigate(e: React.MouseEvent, href: string) {
    // Let modifier-clicks (open in new tab, etc.) and non-primary clicks through untouched.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

    e.preventDefault();
    if (href === pathname || pendingHref !== null) return;

    startedAtRef.current = Date.now();
    setPendingHref(href);
    startTransition(() => router.push(href));
  }

  return (
    <NavTransitionContext.Provider value={{ pathname, isPending: pendingHref !== null, pendingHref, navigate }}>
      {children}
    </NavTransitionContext.Provider>
  );
}

export function useNavTransition() {
  const ctx = useContext(NavTransitionContext);
  if (!ctx) throw new Error("useNavTransition must be used within a NavTransitionProvider");
  return ctx;
}
