import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Xtra — AI Sales Intelligence",
  description: "AI Sales Intelligence Platform สำหรับ RNP Express และ PUKA Logistic",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="font-sans">{children}</body>
    </html>
  );
}
