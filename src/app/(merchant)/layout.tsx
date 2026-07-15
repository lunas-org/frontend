"use client";

// Shared shell for every merchant screen — keeps Frame + BottomNav mounted once instead of
// remounting per page (that remount was what made tab switches feel like a full reload).
// Page content slides between tabs; the bottom nav's active pill slides via a shared layoutId
// in BottomNav itself.
//
// NavTransitionProvider is the single shared "is a tab switch in flight" state, read by
// BottomNav, Sidebar, and MerchantShell's own overlay below — the overlay is what stops page
// controls (e.g. Products' "+ New" button) from being tappable mid-transition, since disabling
// the nav bar alone doesn't touch the rest of the page.

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { Frame } from "@/components/Frame";
import { BottomNav } from "@/components/BottomNav";
import { Sidebar } from "@/components/Sidebar";
import { InstallPrompt } from "@/components/InstallPrompt";
import { NavTransitionProvider, useNavTransition } from "@/lib/navTransition";

const TAB_PATHS = ["/dashboard", "/products", "/notifications", "/settings"];

function MerchantShell({ children, showNav }: { children: React.ReactNode; showNav: boolean }) {
  const pathname = usePathname();
  const { isPending } = useNavTransition();

  return (
    <Frame>
      {showNav && <Sidebar />}
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.2, 0.7, 0.3, 1] }}
        className={`relative ${showNav ? "@md:pl-[220px]" : ""}`}
      >
        {children}
        {showNav && isPending && <div className="absolute inset-0 z-40 cursor-wait bg-paper/70" />}
      </motion.div>
      {showNav && <InstallPrompt />}
      {showNav && <BottomNav />}
    </Frame>
  );
}

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = TAB_PATHS.includes(pathname);

  return (
    <NavTransitionProvider>
      <MerchantShell showNav={showNav}>{children}</MerchantShell>
    </NavTransitionProvider>
  );
}
