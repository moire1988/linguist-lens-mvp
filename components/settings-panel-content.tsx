"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getSettings,
  saveSettings,
  type Accent,
  type CefrLevel,
  type DevAuthState,
} from "@/lib/settings";
import {
  getDbPreferences,
  upsertDbPreferences,
  USER_PREFERENCES_CHANGED_EVENT,
} from "@/lib/db/preferences";

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

/**
 * 設定フォーム本体（スライドメニュー内・旧モーダルと共有）。
 * オーバーレイや外枠は含まない。
 */
export function SettingsPanelContent() {
  const { isSignedIn, userId, getToken } = useAuth();
  const initial = getSettings();
  const [accent, setAccent] = useState<Accent>(initial.accent);
  const [defaultLevel, setDefaultLevel] = useState<CefrLevel>(initial.defaultLevel);
  const [devMode, setDevMode] = useState(initial.devMode);
  const [devAuthState, setDevAuthState] = useState<DevAuthState>(initial.devAuthState);
  const [devUnlocked, setDevUnlocked] = useState(initial.devMode);
  const [versionClicks, setVersionClicks] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [wantsEmail, setWantsEmail] = useState(false);
  const [newsletterPrefsLoaded, setNewsletterPrefsLoaded] = useState(false);

  useEffect(() => {
    if (!isSignedIn || !userId) {
      setNewsletterPrefsLoaded(false);
      return;
    }
    void (async () => {
      const token = await getToken({ template: "supabase" });
      if (!token) {
        setNewsletterPrefsLoaded(true);
        return;
      }
      const prefs = await getDbPreferences(token, userId);
      if (prefs) {
        setAccent(prefs.accent);
        setDefaultLevel(prefs.defaultLevel);
        saveSettings({ accent: prefs.accent, defaultLevel: prefs.defaultLevel });
      }
      setWantsEmail(prefs?.wantsEmail ?? false);
      setNewsletterPrefsLoaded(true);
    })();
  }, [isSignedIn, userId, getToken]);

  const handleAccentChange = async (a: Accent) => {
    setAccent(a);
    saveSettings({ accent: a });
    if (isSignedIn && userId) {
      const token = await getToken({ template: "supabase" });
      if (token) void upsertDbPreferences(token, userId, { accent: a });
    }
  };

  const handleLevelChange = async (l: CefrLevel) => {
    setDefaultLevel(l);
    saveSettings({ defaultLevel: l });
    if (isSignedIn && userId) {
      const token = await getToken({ template: "supabase" });
      if (token) void upsertDbPreferences(token, userId, { defaultLevel: l });
    }
  };

  const handleNewsletterToggle = async () => {
    const next = !wantsEmail;
    const prev = wantsEmail;
    setWantsEmail(next);
    if (isSignedIn && userId) {
      const token = await getToken({ template: "supabase" });
      if (!token) {
        setWantsEmail(prev);
        toast.error("認証トークンを取得できませんでした。");
        return;
      }
      const { error } = await upsertDbPreferences(token, userId, {
        wantsEmail: next,
      });
      if (error) {
        setWantsEmail(prev);
        toast.error("メール設定の保存に失敗しました。もう一度お試しください。");
        return;
      }
      window.dispatchEvent(new CustomEvent(USER_PREFERENCES_CHANGED_EVENT));
    }
  };

  const handleDevModeToggle = () => {
    const next = !devMode;
    setDevMode(next);
    saveSettings({ devMode: next });
    window.location.reload();
  };

  const handleDevAuthStateChange = (state: DevAuthState) => {
    setDevAuthState(state);
    saveSettings({ devAuthState: state });
    window.location.reload();
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
    <div className="space-y-5">
      <div>
        <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          発音アクセント（TTS音声）
        </p>
        <div className="grid grid-cols-3 gap-2">
          {ACCENTS.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => void handleAccentChange(a.value)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition-all",
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
              <span className="text-[9px] leading-none text-slate-400">
                {a.sublabel}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          デフォルトCEFRレベル
        </p>
        <div className="grid grid-cols-6 gap-1.5">
          {CEFR_LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => void handleLevelChange(l)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl border py-2.5 text-center transition-all",
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

      {isSignedIn && (
        <div>
          <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            メールマガジン
          </p>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold leading-snug text-slate-700">
                  メールマガジンから最新情報を受け取る
                </p>
                <p className="mt-0.5 text-[10px] leading-snug text-slate-400">
                  新着コンテンツや機能のお知らせをメールでお届けします
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (newsletterPrefsLoaded) void handleNewsletterToggle();
                }}
                disabled={!newsletterPrefsLoaded}
                className={cn(
                  "relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors",
                  wantsEmail ? "bg-indigo-600" : "bg-slate-300",
                  !newsletterPrefsLoaded && "cursor-not-allowed opacity-50"
                )}
                aria-pressed={wantsEmail}
                aria-label="メールマガジンから最新情報を受け取る"
              >
                <span
                  className={cn(
                    "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
                    wantsEmail ? "translate-x-[18px]" : "translate-x-[2px]"
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {devUnlocked && (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-700">
                  🛠️ Developer (Demo) Mode
                </p>
                <p className="mt-0.5 text-[10px] leading-snug text-slate-400">
                  YouTube APIをスキップし、固定デモスクリプトでClaudeをテスト
                </p>
              </div>
              <button
                type="button"
                onClick={handleDevModeToggle}
                className={cn(
                  "relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors",
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
              <p className="mt-2 text-[10px] font-medium text-indigo-500">
                ON：次の解析はデモスクリプトを使用します
              </p>
            )}
          </div>

          {devMode && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
              <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-amber-600">
                🔐 Auth Mock State
              </p>
              <div className="space-y-2">
                {(
                  [
                    { value: "real" as const, label: "Real", desc: "実際のClerk認証を使用" },
                    { value: "guest" as const, label: "Guest", desc: "未ログイン状態をシミュレート" },
                    { value: "free" as const, label: "Free User", desc: "ログイン済み・無料プラン" },
                    { value: "pro" as const, label: "Pro User", desc: "ログイン済み・有料プラン" },
                  ] satisfies { value: DevAuthState; label: string; desc: string }[]
                ).map((opt) => (
                  <label
                    key={opt.value}
                    className="group flex cursor-pointer items-center gap-2.5"
                  >
                    <input
                      type="radio"
                      name="devAuthState"
                      value={opt.value}
                      checked={devAuthState === opt.value}
                      onChange={() => handleDevAuthStateChange(opt.value)}
                      className="h-3.5 w-3.5 flex-shrink-0 accent-indigo-600"
                    />
                    <div className="min-w-0">
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          devAuthState === opt.value ? "text-indigo-700" : "text-slate-700"
                        )}
                      >
                        {opt.label}
                      </span>
                      <span className="ml-1.5 text-[10px] text-slate-400">{opt.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
              <p className="mt-2.5 text-[10px] font-medium text-amber-600">
                ※ 変更すると即座にリロードされます
              </p>
            </div>
          )}
        </div>
      )}

      <div className="border-t border-slate-100 pt-3 text-center">
        <p
          className="cursor-default select-none text-[10px] text-slate-300"
          onClick={handleVersionClick}
        >
          LinguistLens v1.0.0
        </p>
      </div>
    </div>
  );
}
