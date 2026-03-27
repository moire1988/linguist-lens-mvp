import type { Metadata } from "next";
import { Inter, Goldman } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { GoogleTagManager } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { ClerkProvider } from "@clerk/nextjs";
import { FeedbackModal } from "@/components/feedback-modal";
import { MeshBackground } from "@/components/mesh-background";
import { LoginPromptModal } from "@/components/login-prompt-modal";
import { SiteFooter } from "@/components/site-footer";
import { NavigationDrawerProvider } from "@/components/navigation-drawer-context";
import { AppContentShell } from "@/components/app-content-shell";
import { getPublicSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"] });

/** ルートレイアウトからは default / metadata 等のみ export（Next 型生成と整合） */
const goldman = Goldman({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-goldman",
});

const siteUrl = getPublicSiteUrl();

const title    = "LinguistLens - YouTubeで英語学習を加速させるAIコーチ";
const description =
  "YouTube動画からネイティブ特有の句動詞やイディオムをAIが自動抽出。あなた専用の英語学習コーチが、日常会話のニュアンスまで解説します。";

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
    description,
    images:      ["/og"],
  },
  verification: {
    google: "YL836JuNSH_H4ECwGtf0tbIzdoPR-ezgwgDHzhgMyCw",
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

      <html lang="ja" suppressHydrationWarning>
        <GoogleTagManager gtmId={gtmId} />
        <body
          className={`${inter.className} ${goldman.variable} flex flex-col min-h-screen`}
          style={{ backgroundColor: "#f7f8ff" }}
          suppressHydrationWarning
        >
          <MeshBackground />
          <NavigationDrawerProvider>
            <AppContentShell>{children}</AppContentShell>
          </NavigationDrawerProvider>
          <div className="relative z-[1]">
            <SiteFooter />
          </div>
          <FeedbackModal />
          <LoginPromptModal />
          <Toaster richColors position="bottom-right" />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
