export type Accent = "US" | "UK" | "AU";
export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface UserSettings {
  accent: Accent;
  defaultLevel: CefrLevel;
  devMode: boolean;
}

const SETTINGS_KEY = "ll_settings";

const DEFAULTS: UserSettings = {
  accent: "US",
  defaultLevel: "B2",
  devMode: false,
};

export function getSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<UserSettings>) };
  } catch {
    return DEFAULTS;
  }
}

export function saveSettings(patch: Partial<UserSettings>): void {
  if (typeof window === "undefined") return;
  const current = getSettings();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...patch }));
  window.dispatchEvent(new CustomEvent("ll-settings-changed"));
}

export const ACCENT_LANG: Record<Accent, string> = {
  US: "en-US",
  UK: "en-GB",
  AU: "en-AU",
};

// Developer Mode — designated test URL (transcript is pre-cached in data/mock-transcript.json)
export const DEV_TEST_URL = "https://www.youtube.com/watch?v=Y2Un9HHcJ3I";
export const DEV_TEST_VIDEO_ID = "Y2Un9HHcJ3I";
