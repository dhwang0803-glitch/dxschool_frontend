import type { Metadata } from "next";
import { Suspense } from "react";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import GNB from "@/components/GNB";
import AuthGuard from "@/components/AuthGuard";

const notoSansKR = Noto_Sans_KR({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "DXVOD",
  description: "VOD 추천 서비스",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${notoSansKR.className} antialiased`}>
      <body className="bg-black min-h-screen">
        <Suspense fallback={null}>
          <AuthGuard>
            <GNB />
            <div className="pt-14">{children}</div>
          </AuthGuard>
        </Suspense>
      </body>
    </html>
  );
}
