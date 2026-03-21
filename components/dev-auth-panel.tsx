"use client";

// ─── DevAuthPanel ─────────────────────────────────────────────────────────────
// DevモードがONの時のみ右下に固定表示されるデバッグパネル。
// 3つの認証状態（+ 実際の状態）をラジオボタンで切り替えられる。

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getSettings } from "@/lib/settings";
import {
  getMockAuthState,
  setMockAuthState,
  clearMockAuthState,
  subscribeMockAuth,
  type MockAuthState,
} from "@/lib/mock-auth";

// ─── Config ───────────────────────────────────────────────────────────────────

type Option = {
  value:  MockAuthState | "real";
  label:  string;
  sublabel: string;
  dot:    string;   // Tailwind bg-* class for the radio dot
  ring:   string;   // Tailwind ring/border class when active
  bg:     string;   // Tailwind bg class when active
};

const OPTIONS: Option[] = [
  {
    value:    "real",
    label:    "実際の状態",
    sublabel: "Clerk auth をそのまま使用",
    dot:      "bg-slate-400",
    ring:     "ring-slate-300 border-slate-300",
    bg:       "bg-slate-50",
  },
  {
    value:    "unauthenticated",
    label:    "未ログイン",
    sublabel: "isSignedIn: false",
    dot:      "bg-slate-500",
    ring:     "ring-slate-400 border-slate-400",
    bg:       "bg-slate-100",
  },
  {
    value:    "free",
    label:    "Free ユーザー",
    sublabel: "isSignedIn: true · isPro: false",
    dot:      "bg-blue-500",
    ring:     "ring-blue-300 border-blue-300",
    bg:       "bg-blue-50",
  },
  {
    value:    "pro",
    label:    "Pro ユーザー ★",
    sublabel: "isSignedIn: true · isPro: true",
    dot:      "bg-violet-500",
    ring:     "ring-violet-300 border-violet-300",
    bg:       "bg-violet-50",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function DevAuthPanel() {
  const [devMode,    setDevMode]    = useState(false);
  const [mockState,  setMockState]  = useState<MockAuthState | null>(null);

  // 初期値を読み込む
  useEffect(() => {
    setDevMode(getSettings().devMode);
    setMockState(getMockAuthState());
  }, []);

  // モック状態変化を購読（他コンポーネントが setMockAuthState を呼んだ場合も対応）
  useEffect(() => {
    return subscribeMockAuth(() => setMockState(getMockAuthState()));
  }, []);

  // DevMode設定の変化を購読（設定モーダルでOFF→モックをクリア）
  useEffect(() => {
    const handler = () => {
      const settings = getSettings();
      setDevMode(settings.devMode);
      if (!settings.devMode) clearMockAuthState();
    };
    window.addEventListener("ll-settings-changed", handler);
    return () => window.removeEventListener("ll-settings-changed", handler);
  }, []);

  if (!devMode) return null;

  const currentValue: MockAuthState | "real" = mockState ?? "real";

  const handleSelect = (value: MockAuthState | "real") => {
    if (value === "real") {
      clearMockAuthState();
    } else {
      setMockAuthState(value);
    }
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-[9998] w-60 rounded-2xl border border-violet-200 bg-white shadow-2xl overflow-hidden"
      style={{ boxShadow: "0 8px 32px rgba(109,40,217,0.18)" }}
    >
      {/* Header */}
      <div className="bg-violet-600 px-4 py-2 flex items-center gap-2">
        <span className="text-[9px] font-mono font-bold tracking-[0.15em] text-violet-200 uppercase">
          🛠 Dev Auth Mock
        </span>
      </div>

      {/* Options */}
      <div className="p-2.5 space-y-1.5">
        {OPTIONS.map((opt) => {
          const isActive = currentValue === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all duration-150",
                isActive
                  ? `${opt.bg} ${opt.ring} ring-1`
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              {/* Radio dot */}
              <span
                className={cn(
                  "flex-shrink-0 w-3 h-3 rounded-full border-2 transition-all",
                  isActive
                    ? `${opt.dot} border-transparent`
                    : "border-slate-300 bg-white"
                )}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-xs font-semibold leading-tight",
                    isActive ? "text-slate-800" : "text-slate-600"
                  )}
                >
                  {opt.label}
                </p>
                <p className="text-[9px] font-mono text-slate-400 leading-tight mt-0.5 truncate">
                  {opt.sublabel}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-3 pb-2.5 pt-0.5">
        <p className="text-[9px] text-center font-mono text-slate-300">
          devMode ON · useAppAuth() mock
        </p>
      </div>
    </div>
  );
}
