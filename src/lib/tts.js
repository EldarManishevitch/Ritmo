/**
 * Speak Spanish text using the browser's speechSynthesis.
 * Picks a Spanish voice, lang=es-MX, rate=0.85. Calls onEnd when finished.
 */
export function speakSpanish(text, onEnd) {
  if (typeof window === 'undefined' || !window.speechSynthesis || !text) {
    onEnd?.();
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-MX';
    u.rate = 0.85;
    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find((v) => (v.lang || '').toLowerCase().startsWith('es'));
    if (esVoice) u.voice = esVoice;
    let ended = false;
    const finish = () => { if (!ended) { ended = true; onEnd?.(); } };
    u.onend = finish;
    u.onerror = finish;
    // Safety fallback if the engine never fires onend
    const est = Math.max(1500, text.length * 90);
    setTimeout(finish, est + 1500);
    window.speechSynthesis.speak(u);
  } catch {
    onEnd?.();
  }
}