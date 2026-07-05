"use client";

// Login — CLAUDE.md §9 screen 1: one button, "Lanjut dengan Google". Nothing else.
// Mobile-first: button lives in the thumb zone (bottom), full-width, ≥48px tall.

import { useState } from "react";
import { loginWithGoogle } from "@/lib/magic";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.4a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.9-1.75 2.97-4.32 2.97-7.31Z"
      />
      <path
        fill="#34A853"
        d="M10 20c2.7 0 4.96-.9 6.63-2.44l-3.23-2.5c-.9.6-2.05.96-3.4.96-2.6 0-4.8-1.76-5.6-4.12H1.06v2.59A10 10 0 0 0 10 20Z"
      />
      <path
        fill="#FBBC05"
        d="M4.4 11.9a6 6 0 0 1 0-3.8V5.51H1.06a10 10 0 0 0 0 8.98L4.4 11.9Z"
      />
      <path
        fill="#EA4335"
        d="M10 3.98c1.47 0 2.8.5 3.84 1.5l2.87-2.87A9.96 9.96 0 0 0 10 0 10 10 0 0 0 1.06 5.51L4.4 8.1C5.2 5.74 7.4 3.98 10 3.98Z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError(null);
    setLoading(true);
    try {
      const redirectURI = `${window.location.origin}/login/callback`;
      await loginWithGoogle(redirectURI);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-between p-6">
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <p className="font-display text-4xl font-semibold text-ink">Lunas</p>
        <p className="text-sm text-muted">Bayar dari mana saja.</p>
      </div>

      <div className="mx-auto w-full max-w-sm pb-6">
        <button
          onClick={handleLogin}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary px-6 py-4 font-medium text-paper disabled:opacity-50"
        >
          {!loading && <GoogleIcon />}
          {loading ? "Memuat..." : "Lanjut dengan Google"}
        </button>
        {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
