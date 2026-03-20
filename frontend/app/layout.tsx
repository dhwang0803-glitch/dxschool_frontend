import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import GNB from "@/components/GNB";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DXVOD",
  description: "VOD 추천 서비스",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${geist.variable} antialiased`}>
      <body className="bg-black min-h-screen">
        <GNB />
        <div className="pt-14">{children}</div>
      </body>
    </html>
  );
}
