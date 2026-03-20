"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import {
  Volume2,
  VolumeX,
  BookmarkPlus,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn, getBestEnglishVoice } from "@/lib/utils";
import { getSettings, ACCENT_LANG } from "@/lib/settings";
import type { PhraseResult } from "@/lib/types";

// ─── Props ───────────────────────────────────────────────────────────────────

interface ScriptViewerProps {
  /** Raw text (used for TTS when highlightedHtml is absent) */
  text: string;
  phrases: PhraseResult[];
  /** AI-generated HTML with <b data-expr="..."> markup */
  highlightedHtml?: string;
  savedExpressions: Set<string>;
  onSave: (phrase: PhraseResult) => void;
}

// ─── Sanitizer ───────────────────────────────────────────────────────────────
// Only <b data-expr="..."> and </b> are allowed. Everything else is escaped.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sanitizeHighlight(html: string): string {
  const result: string[] = [];
  // Accept both single- and double-quoted data-expr attributes
  const re = /<b(?:\s+data-expr=(?:"([^"]{0,300})"|'([^']{0,300})'))?>([\s\S]*?)<\/b>/gi;
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(html)) !== null) {
    result.push(escapeHtml(html.slice(lastIndex, m.index)));
    // m[1] = double-quoted value, m[2] = single-quoted value, m[3] = content
    const exprVal = m[1] ?? m[2] ?? "";
    const expr = exprVal ? ` data-expr="${escapeHtml(exprVal)}"` : "";
    result.push(`<b${expr}>${escapeHtml(m[3])}</b>`);
    lastIndex = m.index + m[0].length;
  }
  result.push(escapeHtml(html.slice(lastIndex)));
  return result.join("");
}

/**
 * AI highlight が空だった場合のクライアント側フォールバック。
 * phrases をテキスト内で検索し <b data-expr="..."> で囲む。
 */
function buildClientHighlight(text: string, phrases: PhraseResult[]): string {
  if (!phrases.length) return escapeHtml(text);

  type Span = { start: number; end: number; expr: string };
  const spans: Span[] = [];

  // 長い表現を優先してマッチ（短い表現が長いものの一部に重複しないよう）
  const sorted = [...phrases].sort((a, b) => b.expression.length - a.expression.length);

  for (const p of sorted) {
    const escaped = p.expression.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped, "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const start = m.index;
      const end = start + m[0].length;
      if (!spans.some((s) => start < s.end && end > s.start)) {
        spans.push({ start, end, expr: p.expression });
      }
    }
  }

  spans.sort((a, b) => a.start - b.start);

  const parts: string[] = [];
  let pos = 0;
  for (const s of spans) {
    parts.push(escapeHtml(text.slice(pos, s.start)));
    parts.push(`<b data-expr="${escapeHtml(s.expr)}">${escapeHtml(text.slice(s.start, s.end))}</b>`);
    pos = s.end;
  }
  parts.push(escapeHtml(text.slice(pos)));
  return parts.join("");
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ScriptViewer({
  text,
  phrases,
  highlightedHtml,
  savedExpressions,
  onSave,
}: ScriptViewerProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [collapsed, setCollapsed] = useState(false);
  const [tooltip, setTooltip] = useState<{
    phrase: PhraseResult;
    x: number;
    y: number;
  } | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  // Sanitized HTML (memoized)
  // If AI highlight has no <b> tags (e.g. web scrape text too messy for verbatim copy),
  // fall back to client-side phrase matching on the raw source text.
  const safeHtml = useMemo(() => {
    if (!highlightedHtml) return null;
    const sanitized = sanitizeHighlight(highlightedHtml);
    if (sanitized.includes("<b ")) return sanitized;
    // No highlights survived sanitization → build client-side
    return phrases.length ? buildClientHighlight(text, phrases) : sanitized;
  }, [highlightedHtml, text, phrases]);

  // Plain text for TTS (strip tags if needed)
  const ttsText = useMemo(() => {
    if (highlightedHtml) return highlightedHtml.replace(/<[^>]*>/g, "");
    return text;
  }, [highlightedHtml, text]);

  // ─── TTS ───────────────────────────────────────────────────────────────

  const handleSpeak = useCallback(() => {
    if (!("speechSynthesis" in window)) {
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utt = new SpeechSynthesisUtterance(ttsText);
    const { accent } = getSettings();
    utt.lang = ACCENT_LANG[accent];
    utt.rate = speed;
    const voice = getBestEnglishVoice(accent);
    if (voice) utt.voice = voice;
    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utt);
  }, [ttsText, isSpeaking, speed]);

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

  // ─── Tooltip via event delegation ──────────────────────────────────────

  const scheduleHide = useCallback(() => {
    hideTimer.current = setTimeout(() => setTooltip(null), 180);
  }, []);

  const cancelHide = useCallback(() => {
    clearTimeout(hideTimer.current);
  }, []);

  const handleMouseOver = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== "B") return;
      const expr = target.getAttribute("data-expr");
      if (!expr) return;
      const phrase = phrases.find(
        (p) => p.expression.toLowerCase() === expr.toLowerCase()
      );
      if (!phrase) return;
      clearTimeout(hideTimer.current);
      const rect = target.getBoundingClientRect();
      setTooltip({ phrase, x: rect.left, y: rect.bottom + 6 });
    },
    [phrases]
  );

  const handleMouseOut = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "B") scheduleHide();
    },
    [scheduleHide]
  );

  // ─── Save from tooltip ─────────────────────────────────────────────────

  const handleSave = useCallback(
    (phrase: PhraseResult) => {
      if (savedExpressions.has(phrase.expression.toLowerCase())) return;
      onSave(phrase);
    },
    [savedExpressions, onSave]
  );

  // ─── Render ────────────────────────────────────────────────────────────

  const hasHighlight = !!safeHtml;

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-8 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100">
          {/* Row 1: title + badge (left) / collapse toggle (right) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-bold text-slate-700">全文スクリプト</h2>
              <span className="text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 font-medium">
                {phrases.length} 語ハイライト済み
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Speed selector + TTS — PC only (hidden on SP) */}
              <div className="hidden sm:flex items-center gap-2">
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
              </div>

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

          {/* Row 2: Speed selector + TTS — SP only (hidden on PC) */}
          <div className="flex sm:hidden items-center gap-2 mt-2.5">
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
          </div>
        </div>

        {/* Script body */}
        {!collapsed && (
          <>
            {hasHighlight ? (
              /* AI-highlighted HTML — event delegation for tooltips */
              <div
                className={cn(
                  "px-5 py-4 max-h-72 overflow-y-auto text-sm leading-[1.9] text-slate-700",
                  /* Style all <b> tags inside */
                  "[&_b]:bg-amber-100 [&_b]:text-amber-900 [&_b]:font-bold [&_b]:rounded [&_b]:px-0.5 [&_b]:cursor-pointer [&_b]:transition-colors [&_b:hover]:bg-amber-200"
                )}
                onMouseOver={handleMouseOver}
                onMouseOut={handleMouseOut}
                onMouseLeave={scheduleHide}
                dangerouslySetInnerHTML={{ __html: safeHtml! }}
              />
            ) : (
              /* Fallback: plain text */
              <div className="px-5 py-4 max-h-72 overflow-y-auto text-sm leading-[1.9] text-slate-700">
                {text}
              </div>
            )}

            {/* Legend */}
            <div className="px-5 pb-3 flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                ハイライト = 抽出表現
              </span>
              <span className="text-[10px] text-slate-400">
                ホバーで意味・保存ボタンを表示
              </span>
            </div>
          </>
        )}
      </div>

      {/* Hover tooltip (fixed position) */}
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
              "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg w-full justify-center font-medium transition-all",
              savedExpressions.has(tooltip.phrase.expression.toLowerCase())
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            )}
          >
            {savedExpressions.has(tooltip.phrase.expression.toLowerCase()) ? (
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
