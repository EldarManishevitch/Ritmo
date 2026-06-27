import React, { useEffect, useState } from 'react';
import { BookOpen, Volume2, Bookmark, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { generateDailyWord } from '@/lib/aiHelpers';
import PronunciationCheck from '@/components/song/PronunciationCheck';
import CollapsibleCard from '@/components/song/CollapsibleCard';

export default function DailyWordCard() {
  const [word, setWord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    generateDailyWord()
      .then((w) => { if (!cancelled) setWord(w); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const speak = () => {
    if (!word) return;
    const u = new SpeechSynthesisUtterance(word.spanish_phrase);
    u.lang = 'es-ES';
    u.rate = 0.8;
    speechSynthesis.speak(u);
  };

  const save = async () => {
    if (!word || saved) return;
    try {
      await base44.entities.SavedWord.create({
        word: word.spanish_phrase,
        english_meaning: word.english_translation,
        pronunciation_hint: word.pronunciation,
      });
      setSaved(true);
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-5 animate-pulse h-36" />
    );
  }
  if (!word) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 overflow-hidden">
      <CollapsibleCard
        header={
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">Word of the Day</span>
          </div>
        }
      >
        <div className="px-5 pb-4">
          <p className="text-2xl font-bold text-foreground mb-1">{word.spanish_phrase}</p>
          <p className="text-sm text-muted-foreground mb-2">{word.english_translation}</p>
          <p className="text-xs text-muted-foreground/70 italic mb-3">/{word.pronunciation}/</p>
          <div className="flex items-center gap-2">
            <button
              onClick={speak}
              className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center hover:bg-primary/25 transition-colors active:scale-95"
              title="Hear pronunciation"
            >
              <Volume2 className="h-4 w-4 text-primary" />
            </button>
            <PronunciationCheck targetText={word.spanish_phrase} />
            <button
              onClick={save}
              disabled={saved}
              className="inline-flex items-center gap-1.5 text-sm font-medium px-3 h-9 rounded-full bg-primary/15 text-primary hover:bg-primary/25 transition-colors active:scale-95 disabled:opacity-60"
            >
              {saved ? (
                <><Check className="h-4 w-4" /> Saved</>
              ) : (
                <><Bookmark className="h-4 w-4" /> Save to vocabulary</>
              )}
            </button>
          </div>
        </div>
      </CollapsibleCard>
    </div>
  );
}