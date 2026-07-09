"use client";

// Shared shell for every merchant screen — keeps Frame + BottomNav mounted once instead of
// remounting per page (that remount was what made tab switches feel like a full reload).
// Page content slides between tabs; the bottom nav's active pill slides via a shared layoutId
// in BottomNav itself.

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { Frame } from "@/components/Frame";
import { BottomNav } from "@/components/BottomNav";
import { InstallPrompt } from "@/components/InstallPrompt";

const TAB_PATHS = ["/dashboard", "/products", "/notifications", "/settings"];

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = TAB_PATHS.includes(pathname);

  return (
    <Frame>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.2, 0.7, 0.3, 1] }}
      >
        {children}
      </motion.div>
      {showNav && <InstallPrompt />}
      {showNav && <BottomNav />}
    </Frame>
  );
}
