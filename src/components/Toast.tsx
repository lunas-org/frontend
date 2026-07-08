"use client";

// Minimal toast system — a module-level store + a <Toaster/> mounted once in the root layout.
// Any client component calls `toast("Saved")` without threading context/props. Kept tiny on
// purpose: no dependency, no provider tree. Auto-dismisses; respects the phone-card width.

import { useEffect, useState } from "react";
import { CheckCircle, Info, WarningCircle } from "@phosphor-icons/react/dist/ssr";

type Variant = "success" | "info" | "error";
type ToastItem = { id: number; message: string; variant: Variant };

let items: ToastItem[] = [];
const listeners = new Set<(items: ToastItem[]) => void>();
let nextId = 1;

function emit() {
  for (const l of listeners) l(items);
}

export function toast(message: string, variant: Variant = "success") {
  const id = nextId++;
  items = [...items, { id, message, variant }];
  emit();
  setTimeout(() => {
    items = items.filter((t) => t.id !== id);
    emit();
  }, 2600);
}

const ICONS = { success: CheckCircle, info: Info, error: WarningCircle } as const;
const TONES = {
  success: "text-success",
  info: "text-primary",
  error: "text-danger",
} as const;

export function Toaster() {
  const [list, setList] = useState<ToastItem[]>([]);

  useEffect(() => {
    listeners.add(setList);
    setList(items);
    return () => {
      listeners.delete(setList);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center">
      <div className="flex w-full max-w-[430px] flex-col items-center gap-2 px-4 pt-[calc(12px+env(safe-area-inset-top))]">
        {list.map((t) => {
          const Icon = ICONS[t.variant];
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex w-full items-center gap-2.5 rounded-2xl border border-line bg-white px-4 py-3 shadow-[0_10px_30px_rgba(21,22,27,0.12)]"
              style={{ animation: "fadeUp .28s cubic-bezier(.2,.7,.3,1) both" }}
            >
              <Icon weight="fill" className={`flex-none text-[19px] ${TONES[t.variant]}`} />
              <span className="text-[13.5px] font-semibold text-ink">{t.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
