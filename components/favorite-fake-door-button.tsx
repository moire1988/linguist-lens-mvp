"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { PremiumWaitlistModal } from "@/components/premium-waitlist-modal";

interface FavoriteFakeDoorButtonProps {
  className?: string;
  /** ボタンサイズ（既定: 小さめアイコン） */
  size?: "sm" | "md";
}

/**
 * Premium「お気に入り」の Fake Door。クリックで `PremiumWaitlistModal` を開く。
 */
export function FavoriteFakeDoorButton({
  className,
  size = "sm",
}: FavoriteFakeDoorButtonProps) {
  const [open, setOpen] = useState(false);

  const iconClass = size === "md" ? "h-5 w-5" : "h-4 w-4";

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white/95 p-1.5 text-slate-500 shadow-sm transition-colors hover:border-indigo-400/60 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-400 dark:hover:border-indigo-500/50 dark:hover:text-indigo-300",
          size === "md" && "p-2",
          className
        )}
        aria-label="お気に入りに追加（Premium準備中）"
      >
        <Bookmark className={iconClass} strokeWidth={2} />
      </button>
      {open ? <PremiumWaitlistModal onClose={() => setOpen(false)} /> : null}
    </>
  );
}
