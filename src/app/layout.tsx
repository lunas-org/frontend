import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

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
  title: "Lunas",
  description: "Get paid from anywhere. Lunas.",
  manifest: "/manifest.json",
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
      <body className={`${hankenGrotesk.variable} ${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
