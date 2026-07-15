import { House, Package, Bell, GearSix } from "@phosphor-icons/react/dist/ssr";

// Shared between BottomNav (mobile) and Sidebar (desktop) so the two nav surfaces never drift.
export const NAV_ITEMS = [
  { key: "home", href: "/dashboard", labelKey: "nav.home", icon: House },
  { key: "products", href: "/products", labelKey: "nav.products", icon: Package },
  { key: "notifications", href: "/notifications", labelKey: "nav.activity", icon: Bell },
  { key: "settings", href: "/settings", labelKey: "nav.settings", icon: GearSix },
] as const;
