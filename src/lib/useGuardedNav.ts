"use client";

// Guards one-shot navigation buttons (back arrows, "+ New", list rows, ...) against rapid
// re-tapping before the route swap lands — the same class of bug as the tab-bar nav (see
// navTransition.tsx), but for buttons scattered across individual pages rather than the shared
// tab bar. `go` no-ops any call once a navigation is already in flight; `pending` lets the caller
// disable/dim the tapped control (and, since state is shared per page, every other nav button on
// that page too) until the page unmounts.

import { useState } from "react";
import { useRouter } from "next/navigation";

export function useGuardedNav() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  function go(href: string) {
    if (pending) return;
    setPending(true);
    router.push(href);
  }

  return { go, pending };
}
