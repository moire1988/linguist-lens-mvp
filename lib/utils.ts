import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * ブラウザの音声リストから最も自然な英語音声を返す。
 * 優先順: Google US English → Google en-US → 任意の en-US → 任意の en-* → null（デフォルト）
 */
export function getBestEnglishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined") return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.name === "Google US English") ??
    voices.find((v) => v.lang === "en-US" && v.name.toLowerCase().includes("google")) ??
    voices.find((v) => v.lang === "en-US") ??
    voices.find((v) => v.lang.startsWith("en")) ??
    null
  );
}
