"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getSettings,
  saveSettings,
  type Accent,
  type CefrLevel,
} from "@/lib/settings";

interface SettingsModalProps {
  onClose: () => void;
}

const ACCENTS: { value: Accent; flag: string; sublabel: string }[] = [
  { value: "US", flag: "🇺🇸", sublabel: "American" },
  { value: "UK", flag: "🇬🇧", sublabel: "British" },
  { value: "AU", flag: "🇦🇺", sublabel: "Australian" },
];

const CEFR_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

const CEFR_LABELS: Record<CefrLevel, string> = {
  A1: "入門",
  A2: "初級",
  B1: "中級",
  B2: "中上級",
  C1: "上級",
  C2: "熟達",
};

export function SettingsModal({ onClose }: SettingsModalProps) {
  const initial = getSettings();
  const [accent, setAccent] = useState<Accent>(initial.accent);
  const [defaultLevel, setDefaultLevel] = useState<CefrLevel>(initial.defaultLevel);
  const [devMode, setDevMode] = useState(initial.devMode);
  const [devUnlocked, setDevUnlocked] = useState(initial.devMode);
  const [versionClicks, setVersionClicks] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleAccentChange = (a: Accent) => {
    setAccent(a);
    saveSettings({ accent: a });
  };

  const handleLevelChange = (l: CefrLevel) => {
    setDefaultLevel(l);
    saveSettings({ defaultLevel: l });
  };

  const handleDevModeToggle = () => {
    const next = !devMode;
    setDevMode(next);
    saveSettings({ devMode: next });
  };

  const handleVersionClick = () => {
    const now = Date.now();
    const newCount = now - lastClickTime < 2000 ? versionClicks + 1 : 1;
    setVersionClicks(newCount);
    setLastClickTime(now);
    if (newCount >= 5 && !devUnlocked) {
      setDevUnlocked(true);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
        onClick={onClose}
      />

      {/* Panel — right-aligned drawer below header */}
      <div className="fixed top-14 right-4 sm:right-6 z-50 w-full max-w-xs">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">設定</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* ── Accent ── */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                発音アクセント（TTS音声）
              </p>
              <div className="grid grid-cols-3 gap-2">
                {ACCENTS.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => handleAccentChange(a.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-center transition-all",
                      accent === a.value
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <span className="text-xl leading-none">{a.flag}</span>
                    <span
                      className={cn(
                        "text-xs font-bold leading-none",
                        accent === a.value ? "text-indigo-700" : "text-slate-600"
                      )}
                    >
                      {a.value}
                    </span>
                    <span className="text-[9px] text-slate-400 leading-none">
                      {a.sublabel}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Default CEFR level ── */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                デフォルトCEFRレベル
              </p>
              <div className="grid grid-cols-6 gap-1.5">
                {CEFR_LEVELS.map((l) => (
                  <button
                    key={l}
                    onClick={() => handleLevelChange(l)}
                    className={cn(
                      "flex flex-col items-center gap-0.5 py-2.5 rounded-xl border text-center transition-all",
                      defaultLevel === l
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <span
                      className={cn(
                        "text-sm font-extrabold leading-none",
                        defaultLevel === l ? "text-indigo-700" : "text-slate-700"
                      )}
                    >
                      {l}
                    </span>
                    <span
                      className={cn(
                        "text-[8px] font-medium leading-tight",
                        defaultLevel === l ? "text-indigo-500" : "text-slate-400"
                      )}
                    >
                      {CEFR_LABELS[l]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Dev Mode (hidden until unlocked) ── */}
            {devUnlocked && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-700">
                      🛠️ Developer (Demo) Mode
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                      YouTube APIをスキップし、固定デモスクリプトでClaudeをテスト
                    </p>
                  </div>
                  <button
                    onClick={handleDevModeToggle}
                    className={cn(
                      "flex-shrink-0 relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                      devMode ? "bg-indigo-600" : "bg-slate-300"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
                        devMode ? "translate-x-[18px]" : "translate-x-[2px]"
                      )}
                    />
                  </button>
                </div>
                {devMode && (
                  <p className="mt-2 text-[10px] text-indigo-500 font-medium">
                    ON：次の解析はデモスクリプトを使用します
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer with hidden version text */}
          <div className="px-5 py-3 border-t border-slate-100 text-center">
            <p
              className="text-[10px] text-slate-300 cursor-default select-none"
              onClick={handleVersionClick}
            >
              LinguistLens v1.0.0
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
