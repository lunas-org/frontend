"use client";

// Route transition — template.tsx re-mounts on every navigation (unlike layout.tsx, which
// persists), so wrapping children here gives every route a smooth entrance without touching
// each page. Opacity-only on purpose: a transform on this wrapper would create a containing
// block that breaks the landing page's `sticky` header and any `absolute` BottomNav. The per-
// page `animate-fade-up` still supplies the content-rise motion inside this crossfade.
// prefers-reduced-motion is honored by the global override in globals.css (framer reads the
// media query too, but the CSS clamp keeps it consistent across both animation systems).

import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.2, 0.7, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
