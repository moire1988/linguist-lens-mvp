"use client";

// ─── DevAuthPanel ─────────────────────────────────────────────────────────────
// DevモードがONの時のみ表示されるデバッグパネル。
// ドラッグで移動可能、ヘッダークリックで折りたたみ可能。

import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
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
  value:    MockAuthState | "real";
  label:    string;
  sublabel: string;
  dot:      string;
  ring:     string;
  bg:       string;
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
  const [devMode,   setDevMode]   = useState(false);
  const [mockState, setMockState] = useState<MockAuthState | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  // null = デフォルト位置（bottom-4 right-4）、セット後はtop/leftで制御
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef  = useRef<{
    startX:    number;
    startY:    number;
    startPosX: number;
    startPosY: number;
  } | null>(null);

  // 初期値を読み込む
  useEffect(() => {
    setDevMode(getSettings().devMode);
    setMockState(getMockAuthState());
  }, []);

  useEffect(() => {
    return subscribeMockAuth(() => setMockState(getMockAuthState()));
  }, []);

  useEffect(() => {
    const handler = () => {
      const settings = getSettings();
      setDevMode(settings.devMode);
      if (!settings.devMode) clearMockAuthState();
    };
    window.addEventListener("ll-settings-changed", handler);
    return () => window.removeEventListener("ll-settings-changed", handler);
  }, []);

  // ── ドラッグ ──────────────────────────────────────────────────────────────

  const handleMouseDown = (e: React.MouseEvent) => {
    // ヘッダー内のボタンはドラッグ開始しない
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    // 初回ドラッグ時にデフォルト位置を確定
    if (!pos) setPos({ x: rect.left, y: rect.top });
    dragRef.current = {
      startX:    e.clientX,
      startY:    e.clientY,
      startPosX: rect.left,
      startPosY: rect.top,
    };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPos({
        x: dragRef.current.startPosX + dx,
        y: dragRef.current.startPosY + dy,
      });
    };
    const onUp = () => { dragRef.current = null; };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup",   onUp);
    };
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

  const activeOpt = OPTIONS.find((o) => o.value === currentValue);

  return (
    <div
      ref={panelRef}
      className={cn(
        "fixed z-[9998] w-56 rounded-2xl border border-violet-200 bg-white shadow-2xl overflow-hidden select-none",
        !pos && "bottom-4 right-4",
      )}
      style={{
        boxShadow: "0 8px 32px rgba(109,40,217,0.18)",
        ...(pos ? { left: pos.x, top: pos.y } : {}),
      }}
    >
      {/* Header — ドラッグハンドル兼 折りたたみトグル */}
      <div
        onMouseDown={handleMouseDown}
        className="bg-violet-600 px-3 py-2 flex items-center gap-2 cursor-grab active:cursor-grabbing"
      >
        <span className="text-[9px] font-mono font-bold tracking-[0.15em] text-violet-200 uppercase flex-1">
          🛠 Dev Auth Mock
        </span>
        {/* 現在のモック状態をミニ表示（折りたたみ時のみ） */}
        {collapsed && activeOpt && (
          <span className={cn("text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-md",
            activeOpt.dot === "bg-violet-500" ? "bg-violet-700 text-violet-200"
            : activeOpt.dot === "bg-blue-500"  ? "bg-blue-700 text-blue-200"
            : "bg-slate-700 text-slate-300"
          )}>
            {activeOpt.label}
          </span>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex-shrink-0 p-0.5 rounded hover:bg-violet-500 text-violet-300 hover:text-white transition-colors"
          title={collapsed ? "展開" : "折りたたむ"}
        >
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-150", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Options — 折りたたみ時は非表示 */}
      {!collapsed && (
        <>
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
                  <span
                    className={cn(
                      "flex-shrink-0 w-3 h-3 rounded-full border-2 transition-all",
                      isActive ? `${opt.dot} border-transparent` : "border-slate-300 bg-white"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-xs font-semibold leading-tight", isActive ? "text-slate-800" : "text-slate-600")}>
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

          <div className="px-3 pb-2.5 pt-0.5">
            <p className="text-[9px] text-center font-mono text-slate-300">
              devMode ON · useAppAuth() mock
            </p>
          </div>
        </>
      )}
    </div>
  );
}
