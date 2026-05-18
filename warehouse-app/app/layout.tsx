import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sklad — Складской учет",
  description: "Система управления складским учетом товарных позиций",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
