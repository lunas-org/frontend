"use client";

// Dev-only route so the app/loading.tsx route-transition UI (normally only ever glimpsed mid
// navigation) can be viewed on demand from the DevHud. 404s outside development.

import { notFound } from "next/navigation";
import Loading from "@/app/loading";

export default function LoadingPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <Loading />;
}
