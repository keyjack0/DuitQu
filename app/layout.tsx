import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DuitQu — Manajemen Keuangan Pribadi",
  description: "Aplikasi keuangan pribadi berbasis AI untuk melacak, menganalisis, dan mengoptimalkan arus kas kamu",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DuitQu",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: "#0a0a0a", color: "#f5f5f5" }}>
        {children}
      </body>
    </html>
  );
}
