import React, { useEffect, useState } from 'react';
import { BookOpen, Loader2, CheckCircle2, RotateCw, Volume2, Flame } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { recordWordSuccess, displayLevel, daysToMastery, LEVEL_META, MASTERY_DATE_COUNT } from '@/lib/wordKnowledge';

export default function ReviewRoom() {
  const [words, setWords] = useState([]);
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const load = async () => {
    const [w, f] = await Promise.all([
      base44.entities.SavedWord.filter({ mastered: false }, '-created_date', 100),
      base44.entities.PracticeFlag.list('-created_date', 50),
    ]);
    setWords(w);
    setFlags(f);
  };

  useEffect(() => {
    load().catch(() => {}).finally(() => setLoading(false));
  }, []);

  const current = words[index];

  const speak = (text) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-ES';
    u.rate = 0.8;
    speechSynthesis.speak(u);
  };

  const next = () => {
    setFlipped(false);
    setIndex((i) => (i + 1) % Math.max(words.length, 1));
  };

  // Correct recall: record one dated success. Word leaves the deck only once mastered.
  const gotIt = async () => {
    if (!current) return;
    const updated = await recordWordSuccess(current);
    if (updated.knowledge_level === 'mastered') {
      const remaining = words.filter((_, i) => i !== index);
      setWords(remaining);
      setFlipped(false);
      if (index >= remaining.length) setIndex(Math.max(0, remaining.length - 1));
    } else {
      setWords((ws) => ws.map((w, i) => (i === index ? updated : w)));
      next();
    }
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <h1 className="text-2xl font-bold text-foreground mb-1">Review</h1>
      <p className="text-sm text-muted-foreground mb-6">Flip the card, test yourself, mark mastered</p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">To review</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{words.length}</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">Practice flags</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{flags.length}</p>
        </div>
      </div>

      {/* Flashcard */}
      {words.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-500 mb-3" />
          <p className="text-sm font-medium text-foreground">All caught up!</p>
          <p className="text-xs text-muted-foreground">Save words from songs to build your deck</p>
        </div>
      ) : (
        <>
          <div className="text-xs text-muted-foreground text-center mb-2">
            Card {index + 1} of {words.length}
          </div>
          <div
            onClick={() => setFlipped(!flipped)}
            className="rounded-3xl bg-card border-2 border-border p-8 min-h-[280px] flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/40 transition-colors mb-4"
          >
            {!flipped ? (
              <>
                <p className="text-3xl font-bold text-foreground mb-3">{current.word}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); speak(current.word); }}
                  className="inline-flex items-center gap-1 text-sm text-primary"
                >
                  <Volume2 className="h-4 w-4" /> Hear it
                </button>
                <p className="text-xs text-muted-foreground/60 mt-6">Tap to reveal meaning</p>
              </>
            ) : (
              <>
                <p className="text-xl font-semibold text-foreground mb-2">{current.english_meaning}</p>
                {current.pronunciation_hint && (
                  <p className="text-sm text-muted-foreground italic mb-3">/{current.pronunciation_hint}/</p>
                )}
                {current.is_slang && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">slang</span>
                )}
                <div className="mt-4 flex flex-col items-center gap-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_META[displayLevel(current)].badgeClass}`}>
                    {LEVEL_META[displayLevel(current)].label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {MASTERY_DATE_COUNT - daysToMastery(current)}/{MASTERY_DATE_COUNT} days to mastery
                  </span>
                </div>
                <p className="text-xs text-muted-foreground/60 mt-4">Tap to flip back</p>
              </>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={next}>
              <RotateCw className="h-4 w-4 mr-1" /> Still learning
            </Button>
            <Button className="flex-1" onClick={gotIt}>
              <CheckCircle2 className="h-4 w-4 mr-1" /> Got it
            </Button>
          </div>
        </>
      )}

      {/* Practice flags */}
      {flags.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Words to practice</h2>
          <div className="flex flex-wrap gap-2">
            {flags.map((f) => (
              <span key={f.id} className="px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium">
                {f.word} {f.miss_count > 1 && <span className="text-xs">×{f.miss_count}</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}