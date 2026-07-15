"use client";

// Desktop companion to BottomNav — same items, docked left instead of pinned to the thumb zone
// (desktop has no thumb zone to protect). Hidden below `@md` — a container-query breakpoint keyed
// off Frame's rendered width, not the browser viewport, so the DevHud mode switch can force it
// without resizing the window. See Frame.tsx.

import Link from "next/link";
import { motion } from "framer-motion";
import { NAV_ITEMS } from "@/lib/navItems";
import { useI18n } from "@/lib/i18n";
import { useNavTransition } from "@/lib/navTransition";

export function Sidebar() {
  const { t } = useI18n();
  const { pathname, isPending, pendingHref, navigate } = useNavTransition();

  return (
    <div
      className={`absolute inset-y-0 left-0 z-50 hidden w-[220px] flex-col border-r border-line bg-paper/60 px-3 py-6 @md:flex ${
        isPending ? "pointer-events-none" : ""
      }`}
    >
      <div className="mb-6 px-3 font-display text-lg font-extrabold tracking-tight text-ink">Lunas</div>
      <div className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ key, href, labelKey, icon: Icon }) => {
          const isActive = pathname === href;
          const isLoadingTarget = isPending && pendingHref === href;
          return (
            <Link
              key={key}
              href={href}
              onClick={(e) => navigate(e, href)}
              className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                isActive ? "text-primary" : "text-muted hover:text-ink"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebarActive"
                  className="absolute inset-0 -z-10 rounded-xl bg-primary/[.08]"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              {isLoadingTarget && <span className="skeleton absolute inset-0 -z-10 rounded-xl" />}
              <Icon weight={isActive ? "fill" : "regular"} className="text-[19px]" />
              <span className={isActive ? "font-semibold" : "font-medium"}>{t(labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
