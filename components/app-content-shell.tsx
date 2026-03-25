"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useNavigationDrawer } from "@/components/navigation-drawer-context";

/**
 * ドロワー開閉時にメインコンテンツをわずかに左へスライド（ナビに集中）。
 */
export function AppContentShell({ children }: { children: React.ReactNode }) {
  const { drawerOpen } = useNavigationDrawer();

  useEffect(() => {
    if (drawerOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return undefined;
  }, [drawerOpen]);

  return (
    <div
      className={cn(
        "relative z-[1] flex flex-col flex-1 min-h-0 transition-transform duration-300 ease-out will-change-transform",
        drawerOpen && "-translate-x-2 sm:-translate-x-4"
      )}
    >
      {children}
    </div>
  );
}
