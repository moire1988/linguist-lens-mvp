"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import type { DevAuthState } from "@/lib/settings";
import { getSettings } from "@/lib/settings";

/**
 * `devMode` が ON のときだけヘッダーに表示。設定変更は `ll-settings-changed` で追従。
 * localStorage を読むため、マウント後のみ描画してハイドレーション不一致を防ぐ。
 * ルート変更時も再同期（クライアント遷移で状態がずれるのを防ぐ）。
 */
export function DevHeaderBadge() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [devAuthState, setDevAuthState] = useState<DevAuthState>("real");

  useEffect(() => {
    const sync = () => {
      const s = getSettings();
      setDevMode(s.devMode);
      setDevAuthState(s.devAuthState);
    };
    sync();
    setMounted(true);
    window.addEventListener("ll-settings-changed", sync);
    return () => window.removeEventListener("ll-settings-changed", sync);
  }, [pathname]);

  if (!mounted || !devMode) return null;

  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-600 border border-amber-200 shrink-0">
      <span className="text-[10px] font-bold">🛠️ DEV</span>
      {devAuthState !== "real" && (
        <span className="text-[9px] font-mono opacity-70">{devAuthState}</span>
      )}
    </span>
  );
}
