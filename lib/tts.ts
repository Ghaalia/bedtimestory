// Browser-side text-to-speech wrapper around the SpeechSynthesis API.
// Picks a kid-friendly female voice when one is available.

export interface TTSHandle {
  cancel: () => void;
}

let cachedVoice: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  if (typeof window === "undefined") return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  // Prefer high-quality, gentle, English female voices commonly available on
  // macOS / iOS / Chrome. Fall back to any English voice, then any voice.
  const preferred = [
    "Samantha",
    "Karen",
    "Moira",
    "Ava",
    "Tessa",
    "Google UK English Female",
    "Google US English",
    "Microsoft Aria Online (Natural)",
  ];
  for (const name of preferred) {
    const v = voices.find((x) => x.name === name);
    if (v) return (cachedVoice = v);
  }
  const en = voices.find((v) => v.lang.startsWith("en"));
  cachedVoice = en ?? voices[0];
  return cachedVoice;
}

export function speak(
  text: string,
  opts: { onEnd?: () => void; onError?: () => void; rate?: number } = {},
): TTSHandle {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    opts.onEnd?.();
    return { cancel: () => {} };
  }

  // Cancel any in-flight utterance first; SpeechSynthesis is a singleton queue.
  window.speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if (voice) {
    u.voice = voice;
    u.lang = voice.lang;
  }
  u.rate = opts.rate ?? 0.95;
  u.pitch = 1.05;
  u.volume = 1;
  u.onend = () => opts.onEnd?.();
  u.onerror = () => opts.onError?.();
  window.speechSynthesis.speak(u);

  return {
    cancel: () => window.speechSynthesis.cancel(),
  };
}

export function stopSpeaking() {
  if (typeof window === "undefined") return;
  window.speechSynthesis.cancel();
}

/**
 * Some browsers (Chrome) load voices asynchronously. Call this once on mount
 * to nudge the list to populate, then `pickVoice` will work on subsequent calls.
 */
export function primeVoices(cb?: () => void) {
  if (typeof window === "undefined") return;
  const ready = window.speechSynthesis.getVoices().length > 0;
  if (ready) {
    cb?.();
    return;
  }
  const handler = () => {
    cb?.();
    window.speechSynthesis.removeEventListener("voiceschanged", handler);
  };
  window.speechSynthesis.addEventListener("voiceschanged", handler);
}
