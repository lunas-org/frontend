"use client";

// Shared shell for every merchant screen — keeps Frame + BottomNav mounted once instead of
// remounting per page (that remount was what made tab switches feel like a full reload).
// Page content slides between tabs; the bottom nav's active pill slides via a shared layoutId
// in BottomNav itself.

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { Frame } from "@/components/Frame";
import { BottomNav } from "@/components/BottomNav";

const TAB_PATHS = ["/dashboard", "/products", "/settings"];

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = TAB_PATHS.includes(pathname);

  return (
    <Frame>
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      >
        {children}
      </motion.div>
      {showNav && <BottomNav />}
    </Frame>
  );
}
