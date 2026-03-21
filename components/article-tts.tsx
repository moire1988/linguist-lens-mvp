"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { Play, Pause, Square } from "lucide-react";
import { toast } from "sonner";
import { getSettings, ACCENT_LANG } from "@/lib/settings";
import { getBestEnglishVoice } from "@/lib/utils";
import type { EnglishVariant } from "@/lib/article-types";

// ─── 定数 ────────────────────────────────────────────────────────────────────

const SPEED_OPTIONS = [
  { label: "0.8×", value: 0.8 },
  { label: "1.0×", value: 1.0 },
  { label: "1.2×", value: 1.2 },
  { label: "1.5×", value: 1.5 },
];

// ─── HTML → プレーンテキスト変換 ────────────────────────────────────────────

function htmlToPlainText(html: string): string {
  // <p> タグの区切りをスペースに変換し、それ以外のタグを除去
  return html
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ArticleTtsProps {
  contentHtml: string;
  /** 記事の推奨英語バリアント。TTSの音声選択に使用。 */
  englishVariant: EnglishVariant;
}

export function ArticleTts({ contentHtml, englishVariant }: ArticleTtsProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // クリーンアップ
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const handlePlay = useCallback(() => {
    if (!("speechSynthesis" in window)) {
      toast.error("このブラウザは音声読み上げに対応していません");
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const text = htmlToPlainText(contentHtml);
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);

    // 記事の variant を優先しつつ、"common" の場合はユーザー設定のアクセントを使用
    const { accent } = getSettings();
    const effectiveAccent = englishVariant === "common" ? accent : englishVariant;
    utterance.lang = ACCENT_LANG[effectiveAccent as keyof typeof ACCENT_LANG] ?? "en-US";
    utterance.rate = speed;

    const voice = getBestEnglishVoice(effectiveAccent as "US" | "UK" | "AU");
    if (voice) utterance.voice = voice;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    utteranceRef.current = utterance;
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  }, [contentHtml, englishVariant, isPlaying, speed]);

  const handleStop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
  }, []);

  // スピード変更時は再生中なら再起動
  const handleSpeedChange = useCallback(
    (newSpeed: number) => {
      setSpeed(newSpeed);
      if (isPlaying) {
        window.speechSynthesis?.cancel();
        setIsPlaying(false);
      }
    },
    [isPlaying]
  );

  if (!isLoaded || !isSignedIn) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 mb-6">
      {/* Play / Pause */}
      <button
        onClick={handlePlay}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
          isPlaying
            ? "bg-indigo-600 text-white hover:bg-indigo-700"
            : "bg-white text-slate-700 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
        }`}
        aria-label={isPlaying ? "一時停止" : "記事を読み上げる"}
      >
        {isPlaying ? (
          <>
            <Pause className="w-3.5 h-3.5" />
            一時停止
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5" />
            読み上げ
          </>
        )}
      </button>

      {/* Stop */}
      {isPlaying && (
        <button
          onClick={handleStop}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 border border-slate-200 bg-white hover:bg-slate-100 transition-colors"
          aria-label="停止"
        >
          <Square className="w-3 h-3" />
        </button>
      )}

      {/* Speed selector */}
      <div className="flex items-center gap-1 ml-auto">
        <span className="text-[10px] text-slate-400 mr-1">速度</span>
        {SPEED_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSpeedChange(opt.value)}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
              speed === opt.value
                ? "bg-indigo-600 text-white"
                : "text-slate-500 hover:bg-slate-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
