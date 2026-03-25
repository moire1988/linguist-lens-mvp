"use client";

import Link from "next/link";
import { BookMarked } from "lucide-react";
import { useAuth, useClerk, UserButton } from "@clerk/nextjs";
import { SiteHeader } from "@/components/site-header";
import { NavMenu } from "@/components/nav-menu";

export function ArticleHeader() {
  const { isSignedIn, isLoaded } = useAuth();
  const { openSignIn } = useClerk();

  const right = isLoaded ? (
    <>
      {/* マイ単語帳（ログイン済みのみ表示） */}
      {isSignedIn && (
        <Link
          href="/vocabulary"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-100 transition-colors"
        >
          <BookMarked className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">マイ単語帳</span>
        </Link>
      )}

      {/* ナビゲーションメニュー */}
      <NavMenu />

      {/* 認証 */}
      {isSignedIn ? (
        <UserButton />
      ) : (
        <button
          onClick={() => openSignIn()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
        >
          登録 / ログイン
        </button>
      )}
    </>
  ) : null;

  return <SiteHeader maxWidth="3xl" right={right} />;
}
