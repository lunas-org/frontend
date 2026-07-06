"use client";

import Link from "next/link";
import { House, Package, GearSix } from "@phosphor-icons/react/dist/ssr";

export function BottomNav({ active }: { active: "home" | "products" | "settings" }) {
  const items = [
    { key: "home", href: "/dashboard", label: "Home", icon: House },
    { key: "products", href: "/products", label: "Products", icon: Package },
    { key: "settings", href: "/settings", label: "Settings", icon: GearSix },
  ] as const;

  return (
    <div className="absolute bottom-0 left-0 right-0 flex border-t border-line bg-paper/90 px-3 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2 backdrop-blur-md">
      {items.map(({ key, href, label, icon: Icon }) => {
        const isActive = key === active;
        return (
          <Link
            key={key}
            href={href}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2.5 transition-transform active:scale-95 ${
              isActive ? "text-primary" : "text-muted hover:text-ink"
            }`}
          >
            <Icon weight={isActive ? "fill" : "regular"} className="text-[22px]" />
            <span className={`text-[10.5px] ${isActive ? "font-semibold" : "font-medium"}`}>{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
