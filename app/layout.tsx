import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { GoogleTagManager } from "@next/third-parties/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LinguistLens — 英語表現の深読みツール",
  description:
    "YouTubeやWeb記事のURLを貼り付けるだけで、あなたのレベルに合った重要フレーズをAIが抽出・解説します。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-TJX8DZFD";

  return (
    <html lang="ja">
      <GoogleTagManager gtmId={gtmId} />
      <body className={inter.className}>
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
