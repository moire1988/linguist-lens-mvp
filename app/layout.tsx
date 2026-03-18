import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

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
  return (
    <html lang="ja">
      <body className={inter.className}>
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
