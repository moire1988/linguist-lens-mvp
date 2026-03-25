/**
 * Browser Speech Synthesis for English lines (accent via BCP-47 lang, e.g. en-US).
 */

function normalizeLang(l: string): string {
  return l.toLowerCase().replace("_", "-");
}

function pickVoiceForLang(
  voices: SpeechSynthesisVoice[],
  lang: string
): SpeechSynthesisVoice | undefined {
  const want = normalizeLang(lang);
  const [base, region] = want.split("-");

  const exact = voices.filter((v) => normalizeLang(v.lang) === want);
  if (exact.length > 0) {
    return exact.find((v) => v.localService) ?? exact[0];
  }

  const prefixMatch = voices.filter((v) => {
    const n = normalizeLang(v.lang);
    return n === want || n.startsWith(`${base}-${region}`);
  });
  if (prefixMatch.length > 0) {
    return prefixMatch.find((v) => v.localService) ?? prefixMatch[0];
  }

  const sameBase = voices.filter((v) => normalizeLang(v.lang).startsWith(`${base}-`));
  if (sameBase.length > 0) {
    return sameBase.find((v) => v.localService) ?? sameBase[0];
  }

  return undefined;
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Speak English text using the closest available voice for `lang` (e.g. en-GB).
 * Cancels any current utterance first.
 */
export function speakEnglish(text: string, lang: string): void {
  if (!isSpeechSynthesisSupported()) return;
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return;

  const synth = window.speechSynthesis;
  synth.cancel();

  const run = (): void => {
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = lang;
    utter.rate = 0.92;
    utter.pitch = 1;
    const voice = pickVoiceForLang(synth.getVoices(), lang);
    if (voice) utter.voice = voice;
    synth.speak(utter);
  };

  if (synth.getVoices().length > 0) {
    run();
    return;
  }

  const onVoices = (): void => {
    synth.removeEventListener("voiceschanged", onVoices);
    window.clearTimeout(fallbackTimer);
    run();
  };
  synth.addEventListener("voiceschanged", onVoices);
  const fallbackTimer = window.setTimeout(() => {
    synth.removeEventListener("voiceschanged", onVoices);
    run();
  }, 320);
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}
