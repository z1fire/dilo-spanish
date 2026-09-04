import { normalizeSpeech } from "./spanish-engine";

export function speakSpanish(text: string, rate = .84) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "es-ES";
  utterance.rate = rate;
  const voices = window.speechSynthesis.getVoices();
  utterance.voice = voices.find((voice) => voice.lang.toLowerCase() === "es-es")
    ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("es"))
    ?? null;
  window.speechSynthesis.speak(utterance);
}

export function sentenceTokens(value: string) {
  return value.replace(/[.,;:!?¡¿“”"()]/g, "").split(/\s+/).filter(Boolean);
}

export function tokensMatch(tokens: string[], answer: string) {
  return normalizeSpeech(tokens.join(" ")) === normalizeSpeech(answer);
}

export function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours) return `${hours}h ${minutes}m`;
  return `${Math.max(0, minutes)}m`;
}

export function formatClock(seconds: number) {
  const safe = Math.max(0, seconds);
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

export function percent(part: number, total: number) {
  return total ? Math.round(part / total * 100) : 0;
}

