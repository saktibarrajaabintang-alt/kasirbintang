import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tekno Citra Negara Business Center",
  description: "Aplikasi POS profesional untuk Business Center SMK Citra Negara.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
