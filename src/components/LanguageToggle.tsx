"use client";

// EN/ID segmented toggle. Reads/writes the shared i18n locale. Used in Settings and the landing
// header so both merchants and first-time visitors can switch language.

import { useI18n, type Locale } from "@/lib/i18n";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useI18n();
  const options: Locale[] = ["en", "id"];

  return (
    <div className={`inline-flex rounded-full glass-card p-0.5 ${className}`}>
      {options.map((l) => {
        const active = locale === l;
        return (
          <button
            key={l}
            onClick={() => setLocale(l)}
            aria-pressed={active}
            className={`rounded-full px-3 py-1 text-[12px] font-semibold uppercase transition-colors ${
              active ? "bg-primary text-white" : "text-muted hover:text-ink"
            }`}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
