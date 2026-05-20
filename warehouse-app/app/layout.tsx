import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { t } from "@/lib/i18n";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const inter = Inter({
  subsets: ["cyrillic-ext", "latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${t.app.name} — ${t.app.tagline}`,
  description: t.app.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1e293b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="kk" className={inter.variable}>
      <body className="bg-gray-50 text-gray-900 font-sans antialiased min-h-screen">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
