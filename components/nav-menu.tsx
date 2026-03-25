"use client";

import { useEffect, useState, type ElementType } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import {
  Menu,
  X,
  BookMarked,
  BookOpen,
  Lightbulb,
  Settings,
  Library,
  Crown,
} from "lucide-react";
import { MembershipStatusNav } from "@/components/membership-status-nav";
import { DrawerOverlay } from "@/components/drawer-overlay";
import { useNavigationDrawer } from "@/components/navigation-drawer-context";
import { LinguistLensLogo } from "@/components/linguist-lens-logo";
import { cn } from "@/lib/utils";

interface NavMenuProps {
  onSettings?: () => void;
  vocabCount?: number;
}

type NavLinkDef = {
  icon: ElementType;
  title: string;
  description: string;
  href: string;
  /** プレミアム専用ページ — タイトル横に王冠を表示 */
  premiumCrown?: boolean;
};

const PRIMARY_LINKS: NavLinkDef[] = [
  {
    icon: BookMarked,
    title: "マイ単語帳",
    description: "解析した表現を復習",
    href: "/vocabulary",
  },
  {
    icon: BookOpen,
    title: "学習記事",
    description: "学習のコツと文化背景",
    href: "/articles",
  },
  {
    icon: Library,
    title: "厳選表現ライブラリ",
    description: "生きた表現を検索",
    href: "/library",
    premiumCrown: true,
  },
];

const ABOUT_LINK: NavLinkDef = {
  icon: Lightbulb,
  title: "LinguistLensについて",
  description: "サービスの特徴",
  href: "/about",
};

const ITEM_ROW =
  "group flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left " +
  "border border-transparent transition-all duration-200 " +
  "hover:bg-white/10 hover:border-white/15";

export function NavMenu({ onSettings, vocabCount }: NavMenuProps) {
  const { isSignedIn } = useAuth();
  const { drawerOpen, toggleDrawer, closeDrawer } = useNavigationDrawer();
  const [mounted, setMounted] = useState(false);
  const [panelIn, setPanelIn] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    if (drawerOpen) {
      document.addEventListener("keydown", onEscape);
    }
    return () => document.removeEventListener("keydown", onEscape);
  }, [drawerOpen, closeDrawer]);

  useEffect(() => {
    if (!drawerOpen) {
      setPanelIn(false);
      return;
    }
    setPanelIn(false);
    const id = window.requestAnimationFrame(() => {
      setPanelIn(true);
    });
    return () => window.cancelAnimationFrame(id);
  }, [drawerOpen]);

  const renderLinkRow = (item: NavLinkDef, badge?: number) => {
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={closeDrawer}
        className={ITEM_ROW}
      >
        <Icon
          className="mt-0.5 h-5 w-5 shrink-0 text-violet-200 group-hover:text-white transition-colors"
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="block text-sm font-semibold text-white leading-snug">
              {item.title}
            </span>
            {item.premiumCrown === true && (
              <>
                <span className="sr-only">（プレミアム会員限定）</span>
                <span
                  className="inline-flex shrink-0"
                  title="プレミアム会員限定"
                >
                  <Crown
                    className="h-3.5 w-3.5 text-amber-400 drop-shadow-sm"
                    aria-hidden
                  />
                </span>
              </>
            )}
            {badge !== undefined && badge > 0 && (
              <span className="shrink-0 rounded-full bg-fuchsia-500/90 px-2 py-0.5 text-[10px] font-bold text-white">
                {badge}
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-[11px] text-violet-200/80 leading-relaxed">
            {item.description}
          </span>
        </span>
      </Link>
    );
  };

  const drawerPanel = (
    <>
      <DrawerOverlay open={drawerOpen} onClose={closeDrawer} />
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-[110] flex w-[min(100%,22rem)] flex-col shadow-2xl shadow-black/40",
          "border-l border-white/10",
          "bg-gradient-to-b from-violet-900 via-purple-900 to-indigo-950",
          "transition-transform duration-300 ease-out motion-reduce:transition-none",
          panelIn ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="メインメニュー"
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4">
          <p className="text-xs font-semibold tracking-wide text-white/90">メニュー</p>
          <button
            type="button"
            onClick={closeDrawer}
            className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="閉じる"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          <div className="space-y-1">
            {PRIMARY_LINKS.map((item) =>
              renderLinkRow(
                item,
                item.href === "/vocabulary" && vocabCount && vocabCount > 0
                  ? vocabCount
                  : undefined
              )
            )}
            {renderLinkRow(ABOUT_LINK)}
          </div>
        </div>

        <div className="shrink-0 border-t border-white/10 bg-black/15 px-3 py-4 space-y-3">
          {isSignedIn ? <MembershipStatusNav variant="drawer" /> : null}

          {onSettings ? (
            <button
              type="button"
              onClick={() => {
                onSettings();
                closeDrawer();
              }}
              className={cn(ITEM_ROW, "w-full")}
            >
              <Settings
                className="mt-0.5 h-5 w-5 shrink-0 text-violet-200 group-hover:text-white"
                aria-hidden
              />
              <span className="min-w-0 flex-1 text-left">
                <span className="block text-sm font-semibold text-white leading-snug">
                  設定
                </span>
                <span className="mt-0.5 block text-[11px] text-violet-200/80 leading-relaxed">
                  アクセントとレベル
                </span>
              </span>
            </button>
          ) : null}

          <div className="flex items-center justify-center gap-2 pt-2 opacity-50">
            <LinguistLensLogo size={22} className="opacity-90" />
            <span
              className="text-[10px] font-medium tracking-wider text-white/70"
              style={{ fontFamily: "var(--font-goldman)" }}
            >
              LinguistLens
            </span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleDrawer}
        aria-haspopup="dialog"
        aria-expanded={drawerOpen}
        aria-label="メニューを開く"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 text-xs font-medium transition-colors"
      >
        {drawerOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        <span className="hidden sm:inline">メニュー</span>
      </button>

      {mounted && drawerOpen && typeof document !== "undefined"
        ? createPortal(drawerPanel, document.body)
        : null}
    </div>
  );
}
