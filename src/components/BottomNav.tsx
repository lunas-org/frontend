"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { House, Package, GearSix } from "@phosphor-icons/react/dist/ssr";

const ITEMS = [
  { key: "home", href: "/dashboard", label: "Home", icon: House },
  { key: "products", href: "/products", label: "Products", icon: Package },
  { key: "settings", href: "/settings", label: "Settings", icon: GearSix },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="absolute bottom-0 left-0 right-0 flex border-t border-line bg-paper/90 px-3 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2 backdrop-blur-md">
      {ITEMS.map(({ key, href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={key}
            href={href}
            className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2.5 transition-colors active:scale-95 ${
              isActive ? "text-primary" : "text-muted hover:text-ink"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="bottomNavActive"
                className="absolute inset-x-1.5 inset-y-0.5 -z-10 rounded-xl bg-primary/[.08]"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <Icon weight={isActive ? "fill" : "regular"} className="text-[22px]" />
            <span className={`text-[10.5px] ${isActive ? "font-semibold" : "font-medium"}`}>{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
