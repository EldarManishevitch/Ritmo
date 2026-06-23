import React, { useEffect, useState } from 'react';
import { Sparkles, Volume2 } from 'lucide-react';
import { generateDailyPhrase } from '@/lib/aiHelpers';

export default function DailyPhraseCard() {
  const [phrase, setPhrase] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    generateDailyPhrase()
      .then((p) => { if (!cancelled) setPhrase(p); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const speak = () => {
    if (!phrase) return;
    const u = new SpeechSynthesisUtterance(phrase.spanish_phrase);
    u.lang = 'es-ES';
    u.rate = 0.85;
    speechSynthesis.speak(u);
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-5 animate-pulse h-32" />
    );
  }
  if (!phrase) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-primary uppercase tracking-wide">Phrase of the Day</span>
      </div>
      <p className="text-lg font-bold text-foreground mb-1">{phrase.spanish_phrase}</p>
      <p className="text-sm text-muted-foreground mb-2">{phrase.english_translation}</p>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground/70 italic">/{phrase.pronunciation}/</p>
        <button onClick={speak}
          className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center hover:bg-primary/25 transition-colors active:scale-95">
          <Volume2 className="h-4 w-4 text-primary" />
        </button>
      </div>
    </div>
  );
}