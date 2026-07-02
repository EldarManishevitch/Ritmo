import React, { useEffect, useMemo, useState } from 'react';
import { getCachedWordTranslation, translateWordCached } from '@/lib/aiHelpers';
import { base44 } from '@/api/base44Client';

const todayStr = () => new Date().toISOString().slice(0, 10);

function truncate(s, n) {
  s = s || '';
  return s.length > n ? s.slice(0, n) + '…' : s;
}

export default function FlashActivity({ lines, wordsTapped, wrongWords, onComplete }) {
  const [cards, setCards] = useState([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Build 3 flashcards from priority sources
  useEffect(() => {
    (async () => {
      const sourceSet = new Set();
      // Priority 1: words_tapped
      (wordsTapped || []).forEach((w) => sourceSet.add(w.toLowerCase()));
      // Priority 2: wrong words from quiz
      (wrongWords || []).forEach((w) => sourceSet.add(w.toLowerCase()));
      // Priority 3: top-3 longest words from chorus lines (fallback)
      const allWords = [];
      lines.forEach((l) => {
        (l.spanish_text || '').split(/\s+/).forEach((w) => {
          const clean = w.replace(/[^a-záéíóúüñ]/gi, '').toLowerCase();
          if (clean.length > 3) allWords.push({ word: clean, line: l });
        });
      });
      const longest = [...allWords].sort((a, b) => b.word.length - a.word.length);

      const candidates = [...sourceSet].map((w) => {
        const line = lines.find((l) => (l.spanish_text || '').toLowerCase().includes(w)) || longest.find((c) => c.word === w)?.line || lines[0];
        return { word: w, line };
      });
      // Pad with longest words
      for (const c of longest) {
        if (candidates.length >= 3) break;
        if (!candidates.find((x) => x.word === c.word)) candidates.push(c);
      }
      const three = candidates.slice(0, 3);
      // Attach translations
      await Promise.all(three.map(async (c) => {
        const tr = getCachedWordTranslation(c.word) || await translateWordCached(c.word).catch(() => null);
        c.english = tr?.english_meaning || '';
        c.pronunciation = tr?.pronunciation_hint || '';
      }));
      setCards(three);
    })();
  }, [lines, wordsTapped, wrongWords]);

  const card = cards[idx];
  if (!card) return <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const handleResult = async (gotIt) => {
    try {
      const existing = await base44.entities.SavedWord.filter({ word: card.word });
      const sw = existing?.[0];
      const today = todayStr();
      if (gotIt) {
        const successDates = Array.isArray(sw?.success_dates) ? [...new Set([...sw.success_dates, today])] : [today];
        const mastered = successDates.length >= 21;
        const knowledge = mastered ? 'mastered' : successDates.length >= 1 ? 'known' : 'new';
        if (sw) {
          await base44.entities.SavedWord.update(sw.id, { success_dates: successDates, knowledge_level: knowledge, mastered });
        }
      } else {
        // Need practice — upsert PracticeFlag
        const flags = await base44.entities.PracticeFlag.filter({ word: card.word }).catch(() => []);
        if (flags?.length) {
          await base44.entities.PracticeFlag.update(flags[0].id, { miss_count: (flags[0].miss_count || 0) + 1 });
        } else {
          await base44.entities.PracticeFlag.create({ word: card.word, miss_count: 1 });
        }
        if (sw) {
          await base44.entities.SavedWord.update(sw.id, { knowledge_level: 'new' });
        }
      }
    } catch { /* noop */ }

    if (idx + 1 >= cards.length) {
      onComplete();
    } else {
      setIdx((i) => i + 1);
      setFlipped(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="flex items-center justify-center gap-2 mb-4">
        {cards.map((_, i) => (
          <span key={i} className={`h-2 w-2 rounded-full ${i === idx ? 'bg-primary' : i < idx ? 'bg-primary/40' : 'bg-muted'}`} />
        ))}
      </div>

      <div
        className="relative w-full max-w-sm mx-auto h-56 cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          className="absolute inset-0 transition-transform duration-500"
          style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : '' }}
        >
          {/* Front */}
          <div className="absolute inset-0 rounded-2xl bg-card border-2 border-border flex flex-col items-center justify-center" style={{ backfaceVisibility: 'hidden' }}>
            <p className="text-2xl font-bold text-foreground">{card.word}</p>
            {card.pronunciation && <p className="text-xs text-primary mt-2">🔊 {card.pronunciation}</p>}
            <p className="text-xs text-muted-foreground mt-4">Tap to flip</p>
          </div>
          {/* Back */}
          <div className="absolute inset-0 rounded-2xl bg-primary text-white flex flex-col items-center justify-center p-4" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <p className="text-xl font-bold">{card.english || '—'}</p>
            <p className="text-xs text-white/70 italic mt-3 text-center">"{truncate(card.line?.spanish_text, 60)}"</p>
          </div>
        </div>
      </div>

      {flipped && (
        <div className="flex gap-2 mt-6 max-w-sm mx-auto">
          <button onClick={() => handleResult(false)} className="flex-1 h-11 rounded-xl border-2 border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
            Need practice
          </button>
          <button onClick={() => handleResult(true)} className="flex-1 h-11 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors">
            Got it ✓
          </button>
        </div>
      )}
    </div>
  );
}