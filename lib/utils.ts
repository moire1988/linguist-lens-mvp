import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * ブラウザの音声リストから指定アクセントに最も近い英語音声を返す。
 * accent: "US"（デフォルト）| "UK" | "AU"
 */
export function getBestEnglishVoice(accent: "US" | "UK" | "AU" = "US"): SpeechSynthesisVoice | null {
  if (typeof window === "undefined") return null;
  const voices = window.speechSynthesis.getVoices();

  if (accent === "UK") {
    return (
      voices.find((v) => v.name === "Google UK English Female") ??
      voices.find((v) => v.name === "Google UK English Male") ??
      voices.find((v) => v.lang === "en-GB" && v.name.toLowerCase().includes("google")) ??
      voices.find((v) => v.lang === "en-GB") ??
      voices.find((v) => v.lang === "en-US") ??
      voices.find((v) => v.lang.startsWith("en")) ??
      null
    );
  }

  if (accent === "AU") {
    return (
      voices.find((v) => v.lang === "en-AU" && v.name.toLowerCase().includes("google")) ??
      voices.find((v) => v.lang === "en-AU") ??
      voices.find((v) => v.lang === "en-US") ??
      voices.find((v) => v.lang.startsWith("en")) ??
      null
    );
  }

  // US (default)
  return (
    voices.find((v) => v.name === "Google US English") ??
    voices.find((v) => v.lang === "en-US" && v.name.toLowerCase().includes("google")) ??
    voices.find((v) => v.lang === "en-US") ??
    voices.find((v) => v.lang.startsWith("en")) ??
    null
  );
}
