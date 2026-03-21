import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { GoogleTagManager } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { ClerkProvider } from "@clerk/nextjs";
import { FeedbackModal } from "@/components/feedback-modal";
import { MeshBackground } from "@/components/mesh-background";
import { DevAuthPanel } from "@/components/dev-auth-panel";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = "https://linguist-lens-mvp.vercel.app";

const title    = "LinguistLens - あなただけの英語学習AIコーチ";
const description =
  "YouTubeやWeb記事のURLを貼るだけで、CEFRレベルに合った句動詞・イディオム・コロケーションをAIが抽出・解説。英語を「知っている」から「使える」へ。";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default:  title,
    template: "%s | LinguistLens",
  },
  description,
  openGraph: {
    type:        "website",
    url:         siteUrl,
    siteName:    "LinguistLens",
    title,
    description,
    locale:      "ja_JP",
    images: [
      {
        url:    "/og",
        width:  1200,
        height: 630,
        alt:    title,
      },
    ],
  },
  twitter: {
    card:        "summary_large_image",
    title,
    description: "YouTubeやWebの英語コンテンツから重要フレーズをAIが抽出。句動詞・イディオムをCEFRレベル別に効率よくマスターしよう。",
    images:      ["/og"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-TJX8DZFD";

  return (
    <ClerkProvider afterSignOutUrl="/">

      <html lang="ja">
        <GoogleTagManager gtmId={gtmId} />
        <body className={inter.className} style={{ backgroundColor: "#f7f8ff" }}>
          <MeshBackground />
          {children}
          <FeedbackModal />
          <DevAuthPanel />
          <Toaster richColors position="bottom-right" />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
