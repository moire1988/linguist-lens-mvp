"use client";

import { useEffect, useState } from "react";
import { ACCENT_LANG, getSettings } from "@/lib/settings";
import type { Accent } from "@/lib/settings";

/**
 * BCP-47 language tag for TTS matching the user's accent setting (US / UK / AU).
 * Updates when settings change (same tab or `ll-settings-changed`).
 */
export function useAccentLang(): { accent: Accent; lang: string } {
  const [state, setState] = useState<{ accent: Accent; lang: string }>(() => {
    if (typeof window === "undefined") {
      return { accent: "US", lang: "en-US" };
    }
    const { accent } = getSettings();
    return { accent, lang: ACCENT_LANG[accent] };
  });

  useEffect(() => {
    const sync = (): void => {
      const { accent } = getSettings();
      setState({ accent, lang: ACCENT_LANG[accent] });
    };
    sync();
    window.addEventListener("ll-settings-changed", sync);
    return () => window.removeEventListener("ll-settings-changed", sync);
  }, []);

  return state;
}
