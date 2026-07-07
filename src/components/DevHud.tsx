"use client";

// Dev-only nav HUD — quick links to every route while building UI, so you don't have to
// remember paths/query params by hand. Renders nothing outside development.

import { useState } from "react";
import Link from "next/link";

const LINKS: { href: string; label: string; note?: string }[] = [
  { href: "/", label: "Landing" },
  { href: "/login", label: "Merchant login" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/products", label: "Products list" },
  { href: "/products/new", label: "New product" },
  { href: "/profile-setup", label: "Profile setup" },
  { href: "/settings", label: "Settings" },
  {
    href: "/checkout?demo=1&title=Workshop+ticket&price=25.00&merchant=Studio+Mira",
    label: "Checkout (demo)",
    note: "use the demo buttons on this page to reach processing / success / underpaid / unsupported / already-paid",
  },
  { href: "/checkout", label: "Checkout (expired — no params)" },
];

export function DevHud() {
  const [open, setOpen] = useState(false);

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="fixed bottom-3 right-3 z-[999] font-sans text-[13px]">
      {open && (
        <div className="mb-2 w-64 rounded-xl border border-black/10 bg-white/95 p-2 shadow-lg backdrop-blur">
          <p className="px-2 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wide text-black/40">
            Pages
          </p>
          <div className="flex max-h-[70vh] flex-col gap-0.5 overflow-y-auto">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-1.5 leading-tight text-black/80 hover:bg-black/5"
              >
                <div className="font-medium">{link.label}</div>
                {link.note && <div className="text-[10.5px] text-black/40">{link.note}</div>}
              </Link>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-black/80 text-white shadow-lg hover:bg-black"
        aria-label="Toggle dev page HUD"
      >
        {open ? "×" : "☰"}
      </button>
    </div>
  );
}
