"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Volume2, VolumeX, BookmarkPlus, Check, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { PhraseResult } from "@/lib/types";
import { savePhrase, isSaved } from "@/lib/vocabulary";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ScriptViewerProps {
  text: string;
  phrases: PhraseResult[];
  sourceUrl?: string;
}

type Segment =
  | { kind: "text"; content: string }
  | { kind: "highlight"; content: string; phrase: PhraseResult };

// ─── Highlight colors per type ───────────────────────────────────────────────

const TYPE_HL: Record<string, { base: string; hover: string }> = {
  phrasal_verb:   { base: "bg-violet-100 text-violet-900", hover: "hover:bg-violet-200" },
  idiom:          { base: "bg-amber-100  text-amber-900",  hover: "hover:bg-amber-200"  },
  collocation:    { base: "bg-sky-100    text-sky-900",    hover: "hover:bg-sky-200"    },
  grammar_pattern:{ base: "bg-emerald-100 text-emerald-900", hover: "hover:bg-emerald-200" },
};
const SAVED_HL = "bg-emerald-50 text-emerald-700 hover:bg-emerald-100";

// ─── Text segmentation ───────────────────────────────────────────────────────

function buildSegments(text: string, phrases: PhraseResult[]): Segment[] {
  if (!text || !phrases.length) return [{ kind: "text", content: text }];

  const sorted = [...phrases]
    .filter((p) => p.expression.trim())
    .sort((a, b) => b.expression.length - a.expression.length);

  const escaped = sorted.map((p) =>
    p.expression.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);

  return parts.map((part) => {
    const matched = phrases.find(
      (p) => p.expression.toLowerCase() === part.toLowerCase()
    );
    return matched
      ? { kind: "highlight", content: part, phrase: matched }
      : { kind: "text", content: part };
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ScriptViewer({ text, phrases, sourceUrl }: ScriptViewerProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [collapsed, setCollapsed] = useState(false);
  const [savedSet, setSavedSet] = useState<Set<string>>(new Set());
  const [tooltip, setTooltip] = useState<{
    phrase: PhraseResult;
    x: number;
    y: number;
  } | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  // Initialise saved set from localStorage
  useEffect(() => {
    setSavedSet(
      new Set(
        phrases
          .filter((p) => isSaved(p.expression))
          .map((p) => p.expression.toLowerCase())
      )
    );
  }, [phrases]);

  const segments = useMemo(() => buildSegments(text, phrases), [text, phrases]);

  // ─── TTS ─────────────────────────────────────────────────────────────────

  const handleSpeak = useCallback(() => {
    if (!("speechSynthesis" in window)) {
      toast.error("このブラウザは音声読み上げに対応していません");
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "en-US";
    utt.rate = speed;
    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utt);
  }, [text, isSpeaking, speed]);

  const handleSpeedChange = useCallback(
    (s: number) => {
      setSpeed(s);
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    },
    [isSpeaking]
  );

  // ─── Tooltip ─────────────────────────────────────────────────────────────

  const showTooltip = useCallback(
    (phrase: PhraseResult, e: React.MouseEvent<HTMLElement>) => {
      clearTimeout(hideTimer.current);
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltip({ phrase, x: rect.left, y: rect.bottom + 6 });
    },
    []
  );

  const scheduleHide = useCallback(() => {
    hideTimer.current = setTimeout(() => setTooltip(null), 180);
  }, []);

  const cancelHide = useCallback(() => {
    clearTimeout(hideTimer.current);
  }, []);

  // ─── Save from tooltip ───────────────────────────────────────────────────

  const handleSave = useCallback(
    (phrase: PhraseResult) => {
      const key = phrase.expression.toLowerCase();
      if (savedSet.has(key)) return;
      const result = savePhrase({
        expression: phrase.expression,
        type: phrase.type,
        cefr_level: phrase.cefr_level,
        meaning_ja: phrase.meaning_ja,
        nuance: phrase.nuance,
        example: phrase.example,
        context: phrase.context,
        why_hard_for_japanese: phrase.why_hard_for_japanese,
        sourceUrl,
      });
      if (result.success) {
        setSavedSet((s) => { const n = new Set(s); n.add(key); return n; });
        toast.success(`「${phrase.expression}」を保存しました`);
      }
    },
    [savedSet, sourceUrl]
  );

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-slate-700">全文スクリプト</h2>
            <span className="text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 font-medium">
              {phrases.length} 語ハイライト済み
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Speed selector */}
            <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
              {[0.5, 1.0, 1.5, 2.0].map((s) => (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={cn(
                    "px-2 py-1 rounded-md text-xs font-medium transition-all",
                    speed === s
                      ? "bg-white text-indigo-600 shadow-sm font-semibold"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* TTS button */}
            <button
              onClick={handleSpeak}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                isSpeaking
                  ? "bg-indigo-100 text-indigo-600 ring-2 ring-indigo-200"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {isSpeaking ? (
                <VolumeX className="h-3.5 w-3.5" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" />
              )}
              {isSpeaking ? "停止" : "読み上げ"}
            </button>

            {/* Collapse toggle */}
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
              title={collapsed ? "展開" : "折りたたむ"}
            >
              {collapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Script body */}
        {!collapsed && (
          <div className="px-5 py-4 max-h-72 overflow-y-auto text-sm leading-[1.9] text-slate-700">
            {segments.map((seg, i) => {
              if (seg.kind === "text") {
                return <span key={i}>{seg.content}</span>;
              }
              const hl = TYPE_HL[seg.phrase.type] ?? {
                base: "bg-indigo-100 text-indigo-900",
                hover: "hover:bg-indigo-200",
              };
              const saved = savedSet.has(seg.phrase.expression.toLowerCase());
              return (
                <mark
                  key={i}
                  className={cn(
                    "rounded px-0.5 font-bold cursor-pointer transition-colors not-italic",
                    saved ? SAVED_HL : `${hl.base} ${hl.hover}`
                  )}
                  onMouseEnter={(e) => showTooltip(seg.phrase, e)}
                  onMouseLeave={scheduleHide}
                >
                  {seg.content}
                </mark>
              );
            })}
          </div>
        )}

        {/* Color legend */}
        {!collapsed && (
          <div className="px-5 pb-3 flex flex-wrap gap-3">
            {[
              { key: "phrasal_verb",    label: "句動詞",       cls: "bg-violet-100 text-violet-700" },
              { key: "idiom",           label: "イディオム",   cls: "bg-amber-100  text-amber-700"  },
              { key: "collocation",     label: "コロケーション", cls: "bg-sky-100  text-sky-700"    },
              { key: "grammar_pattern", label: "文法パターン", cls: "bg-emerald-100 text-emerald-700" },
            ]
              .filter((l) => phrases.some((p) => p.type === l.key))
              .map((l) => (
                <span
                  key={l.key}
                  className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", l.cls)}
                >
                  {l.label}
                </span>
              ))}
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              ✓ 保存済み
            </span>
          </div>
        )}
      </div>

      {/* Hover tooltip (fixed) */}
      {tooltip && (
        <div
          className="fixed z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-56"
          style={{
            left: Math.min(
              tooltip.x,
              typeof window !== "undefined" ? window.innerWidth - 240 : 560
            ),
            top: tooltip.y,
          }}
          onMouseEnter={cancelHide}
          onMouseLeave={() => setTooltip(null)}
        >
          <p className="text-xs font-bold text-slate-800 mb-0.5">
            {tooltip.phrase.expression}
          </p>
          <p className="text-xs text-slate-500 mb-2.5 leading-relaxed">
            {tooltip.phrase.meaning_ja}
          </p>
          <button
            onClick={() => handleSave(tooltip.phrase)}
            className={cn(
              "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg w-full justify-center transition-all font-medium",
              savedSet.has(tooltip.phrase.expression.toLowerCase())
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            )}
          >
            {savedSet.has(tooltip.phrase.expression.toLowerCase()) ? (
              <>
                <Check className="h-3 w-3" />
                保存済み
              </>
            ) : (
              <>
                <BookmarkPlus className="h-3 w-3" />
                単語帳に保存
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
}
