import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import { BootScript } from "@/components/shell/boot-script";
import { MotionProvider } from "@/components/motion";
import { SmoothScroll } from "@/components/smooth-scroll";
import { RegisterServiceWorker } from "@/components/register-sw";
import { getDict } from "@/lib/i18n/server";
import { I18nProvider } from "@/lib/i18n/provider";
import "./globals.css";

/** Brand typeface from components/font (SF Pro Rounded), self-hosted through next/font. */
const sans = localFont({
  src: [
    { path: "../components/font/SF-Pro-Rounded-Light.otf", weight: "300", style: "normal" },
    { path: "../components/font/SF-Pro-Rounded-Regular.otf", weight: "400", style: "normal" },
    { path: "../components/font/SF-Pro-Rounded-Medium.otf", weight: "500", style: "normal" },
    { path: "../components/font/SF-Pro-Rounded-Semibold.otf", weight: "600", style: "normal" },
    { path: "../components/font/SF-Pro-Rounded-Bold.otf", weight: "700", style: "normal" },
    { path: "../components/font/SF-Pro-Rounded-Heavy.otf", weight: "800", style: "normal" },
  ],
  variable: "--font-sama",
  display: "swap",
});
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jetbrains", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getDict();
  return {
    title: { default: d.meta.title, template: "%s · Sama" },
    description: d.meta.description,
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [
        { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Sama",
    },
  };
}

export const viewport: Viewport = {
  // Without "cover", iOS reports env(safe-area-inset-*) as 0 in an installed PWA and the tab bar sits on the home indicator.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0d" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale } = await getDict();
  return (
    <html lang={locale} className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <BootScript />
      </head>
      <body>
        <SmoothScroll />
        <RegisterServiceWorker />
        <I18nProvider locale={locale}>
          <MotionProvider>{children}</MotionProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
