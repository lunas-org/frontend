"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { NAV_ITEMS } from "@/lib/navItems";
import { useI18n } from "@/lib/i18n";
import { useNavTransition } from "@/lib/navTransition";

export function BottomNav() {
  const { t } = useI18n();
  const { pathname, isPending, pendingHref, navigate } = useNavTransition();

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-50 flex border-t border-line bg-paper/90 px-3 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2 backdrop-blur-md @md:hidden ${
        isPending ? "pointer-events-none" : ""
      }`}
    >
      {NAV_ITEMS.map(({ key, href, labelKey, icon: Icon }) => {
        const isActive = pathname === href;
        const isLoadingTarget = isPending && pendingHref === href;
        return (
          <Link
            key={key}
            href={href}
            onClick={(e) => navigate(e, href)}
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
            {isLoadingTarget && <span className="skeleton absolute inset-x-1.5 inset-y-0.5 -z-10 rounded-xl" />}
            <Icon weight={isActive ? "fill" : "regular"} className="text-[22px]" />
            <span className={`text-[10.5px] ${isActive ? "font-semibold" : "font-medium"}`}>{t(labelKey)}</span>
          </Link>
        );
      })}
    </div>
  );
}
