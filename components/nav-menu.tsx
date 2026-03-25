"use client";

import { useState, useRef, useEffect, type ElementType } from "react";
import Link from "next/link";
import { Menu, X, BookMarked, BookOpen, Lightbulb, Settings } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type NavItem =
  | { icon: ElementType; label: string; href: string;  badge?: number; onClick?: never }
  | { icon: ElementType; label: string; href?: never;  badge?: number; onClick: () => void };

interface NavMenuProps {
  /** コールバックが渡された場合のみ「設定」項目を表示する */
  onSettings?: () => void;
  /** マイ単語帳のバッジ数 (0 または未指定ならバッジ非表示) */
  vocabCount?: number;
}

// ─── Shared item style ────────────────────────────────────────────────────────

const ITEM_CLS =
  "group w-full flex items-center gap-3 py-2.5 pl-3 pr-3 rounded-xl " +
  "text-sm font-medium text-slate-700 text-left " +
  "border-l-2 border-transparent " +
  "hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 " +
  "transition-colors duration-200";

// ─── Component ───────────────────────────────────────────────────────────────

export function NavMenu({ onSettings, vocabCount }: NavMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  // ── Item groups ─────────────────────────────────────────────────────────────

  const learningItems: NavItem[] = [
    {
      icon: BookMarked,
      label: "マイ単語帳",
      href: "/vocabulary",
      badge: vocabCount && vocabCount > 0 ? vocabCount : undefined,
    },
    { icon: BookOpen, label: "学習記事", href: "/articles" },
  ];

  const utilityItems: NavItem[] = [
    { icon: Lightbulb, label: "LinguistLensについて", href: "/about" },
    ...(onSettings
      ? [
          {
            icon: Settings,
            label: "設定",
            onClick: () => { onSettings(); setOpen(false); },
          } satisfies NavItem,
        ]
      : []),
  ];

  // ── Renderer ─────────────────────────────────────────────────────────────────

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    const inner = (
      <>
        <Icon className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 shrink-0 transition-colors duration-200" />
        <span className="flex-1">{item.label}</span>
        {item.badge !== undefined && (
          <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
            {item.badge}
          </span>
        )}
      </>
    );

    if (item.href !== undefined) {
      return (
        <Link
          key={item.label}
          href={item.href}
          role="menuitem"
          onClick={() => setOpen(false)}
          className={ITEM_CLS}
        >
          {inner}
        </Link>
      );
    }

    return (
      <button
        key={item.label}
        role="menuitem"
        onClick={item.onClick}
        className={ITEM_CLS}
      >
        {inner}
      </button>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div ref={ref} className="relative">
      {/* トリガーボタン */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="メニューを開く"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 text-xs font-medium transition-colors"
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        <span className="hidden sm:inline">Menu</span>
      </button>

      {/* ドロップダウン */}
      {open && (
        <div
          role="menu"
          className={[
            "absolute right-0 top-full mt-2 w-56 z-[9999]",
            "bg-white",
            "border border-slate-200 rounded-2xl",
            "shadow-xl shadow-slate-200/80",
            "overflow-hidden",
          ].join(" ")}
        >
          {/* 上部ラベル */}
          <div className="px-4 pt-3 pb-1.5">
            <p className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest">
              Navigation
            </p>
          </div>

          {/* 学習系グループ */}
          <div className="px-2 pb-1">
            {learningItems.map(renderItem)}
          </div>

          {/* Divider */}
          <div className="mx-3 my-1 border-t border-slate-100" />

          {/* ユーティリティグループ */}
          <div className="px-2 pb-2">
            {utilityItems.map(renderItem)}
          </div>

          {/* フッター */}
          <div className="border-t border-slate-100 px-3 py-2">
            <p className="text-[10px] text-slate-300 text-center font-mono tracking-wider">
              LinguistLens
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
