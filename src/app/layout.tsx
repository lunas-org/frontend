import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { MotionConfig } from "framer-motion";
import "./globals.css";
import { DevHud } from "@/components/DevHud";
import { Toaster } from "@/components/Toast";
import { OfflineBanner } from "@/components/OfflineBanner";
import { I18nProvider } from "@/lib/i18n";

// Display font (amounts, headlines) + body font, per CLAUDE.md §9's design system.
// Self-hosted (not next/font/google) so `pnpm dev` never depends on reaching
// fonts.gstatic.com at runtime — both are variable fonts, one file covers all weights.
const hankenGrotesk = localFont({
  src: "./fonts/hanken-grotesk-variable.woff2",
  variable: "--font-display",
  display: "swap",
  weight: "100 900",
});
const inter = localFont({
  src: "./fonts/inter-variable.woff2",
  variable: "--font-body",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://lunas.app"),
  title: "Lunas",
  description: "Get paid from anywhere. Lunas.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/apple-touch-icon.png",
  },
  // Link previews (WhatsApp / social) — the product lives on shared links, so these matter.
  // Drop public/og-image.png (1200×630, see ASSET-PLAN.md) and previews light up automatically.
  openGraph: {
    title: "Lunas",
    description: "Get paid from anywhere. The status flips to Lunas ✓ the moment it's done.",
    images: ["/og-image.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lunas",
    description: "Get paid from anywhere. The status flips to Lunas ✓ the moment it's done.",
    images: ["/og-image.png"],
  },
  appleWebApp: { capable: true, title: "Lunas", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FBFAF7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${hankenGrotesk.variable} ${inter.variable} antialiased`}>
        <MotionConfig reducedMotion="user">
          <I18nProvider>
            {children}
            <OfflineBanner />
            <Toaster />
            <DevHud />
          </I18nProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
