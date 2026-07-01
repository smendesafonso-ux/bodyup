import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { PwaSetup } from "@/components/PwaSetup";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BODYUP — Coach santé IA",
  description: "Nutrition, activité physique et coaching personnalisé par IA. Mobile-first.",
};

export const viewport: Viewport = {
  themeColor: "#0a0d09",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={hanken.variable}>
      <head>
        {/* Clash Display — police d'affichage distinctive (non disponible sur next/font) */}
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@500,600,700&display=swap"
          rel="stylesheet"
        />
        {/* PWA — installable en natif + icône d'accueil (chemins avec basePath /bodyup) */}
        <link rel="manifest" href="/bodyup/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/bodyup/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/bodyup/favicon-32.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BODYUP" />
      </head>
      <body>{children}<PwaSetup /></body>
    </html>
  );
}
