import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MMT 공연 관리",
  description: "Metaverse Moving Theater 공연 관리 시스템 — WhoseEgg",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
