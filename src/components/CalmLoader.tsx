"use client";

// A calm, breathing loading indicator — used for the brief "something's happening" moments
// (CLAUDE.md §9: "Turns the few-second routing delay into something that feels intentional,
// never an error"). Respects prefers-reduced-motion via the global override in globals.css.

import { motion } from "framer-motion";

export function CalmLoader({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        className="h-3 w-3 rounded-full bg-primary"
        animate={{ scale: [1, 1.6, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
