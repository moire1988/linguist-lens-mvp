"use client";

import Link from "next/link";
import { BookMarked } from "lucide-react";
import { useAuth, useClerk, UserButton } from "@clerk/nextjs";
import { NavMenu } from "@/components/nav-menu";

// ─── Props ───────────────────────────────────────────────────────────────────

interface GlobalNavProps {
  /** 設定パネルを開くコールバック。省略時はメニューに「設定」が表示されない */
  onSettings?: () => void;
  /** ログイン済みのとき /vocabulary へのショートカット（記事ページなど） */
  showVocabularyLink?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * サイト共通のナビゲーション右側 (NavMenu + UserButton/SignIn)。
 * SiteHeader の right スロットに渡す想定。
 */
export function GlobalNav({ onSettings, showVocabularyLink }: GlobalNavProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const { openSignIn } = useClerk();

  if (!isLoaded) return null;

  return (
    <div className="flex items-center gap-2">
      {showVocabularyLink && isSignedIn && (
        <Link
          href="/vocabulary"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-100 transition-colors"
        >
          <BookMarked className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">マイ単語帳</span>
        </Link>
      )}
      <NavMenu onSettings={onSettings} />
      {isSignedIn ? (
        <UserButton />
      ) : (
        <button
          onClick={() => openSignIn()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
        >
          Sign In
        </button>
      )}
    </div>
  );
}
