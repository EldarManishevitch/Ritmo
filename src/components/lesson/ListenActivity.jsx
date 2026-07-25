import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Volume2 } from 'lucide-react';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { translateWordCached } from '@/lib/aiHelpers';
import { addTappedWord } from '@/lib/dailyLesson';
import { savedWordsRepo } from '@/data/repositories/savedWords.repo';

export default function ListenActivity({ lesson, lines, onReady }) {
  const [showTranslations, setShowTranslations] = useState(() => Object.create(null));
  const [tapped, setTapped] = useState(new Set(lesson.words_tapped || []));
  const [savedFlash, setSavedFlash] = useState(null);
  const playerContainerId = 'lesson-yt-player';
  const nudgeTimer = useRef(null);

  const { ready, isPlaying } = useYouTubePlayer(lesson.song_youtube_id || '', playerContainerId);

  // 90s nudge
  useEffect(() => {
    if (!isPlaying) return;
    nudgeTimer.current = setTimeout(() => setShowNudge(true), 90000);
    return () => clearTimeout(nudgeTimer.current);
  }, [isPlaying]);
  const [showNudge, setShowNudge] = useState(false);

  const handleWordTap = async (word, e) => {
    e.stopPropagation();
    const clean = word.replace(/[^a-záéíóúüñ]/gi, '').toLowerCase();
    if (!clean || tapped.has(clean)) return;
    setTapped((prev) => new Set([...prev, clean]));
    setSavedFlash(clean);
    setTimeout(() => setSavedFlash(null), 1200);
    addTappedWord(clean).catch(() => {});
    // Save to SavedWord (best-effort)
    try {
      const existing = await savedWordsRepo.filter({ word: clean, source_song_id: lesson.song_id });
      if (!existing?.length) {
        const tr = await translateWordCached(clean).catch(() => null);
        await savedWordsRepo.create({
          word: clean,
          english_meaning: tr?.english_meaning || '',
          pronunciation_hint: tr?.pronunciation_hint || '',
          source_song_id: lesson.song_id,
          is_slang: false,
        });
      }
    } catch { /* noop */ }
  };

  const tokenize = (text) =>
    (text || '').split(/(\s+)/).map((tok, i) => {
      const isWord = /[a-záéíóúüñ]/i.test(tok);
      const clean = tok.replace(/[^a-záéíóúüñ]/gi, '').toLowerCase();
      const isTapped = isWord && tapped.has(clean);
      return (
        <span key={i}>
          {isWord ? (
            <span
              onClick={(e) => handleWordTap(tok, e)}
              className={`cursor-pointer rounded ${isTapped ? 'underline decoration-green-500 decoration-2 underline-offset-2 text-green-600' : 'hover:bg-primary/10'}`}
            >
              {tok}
            </span>
          ) : tok}
        </span>
      );
    });

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {/* YouTube player */}
      <div className="relative bg-black rounded-xl overflow-hidden mb-4">
        <div id={playerContainerId} className="w-full aspect-video" />
        {!ready && <div className="absolute inset-0 flex items-center justify-center bg-black"><div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>}
      </div>

      {/* Chorus lines */}
      <div className="space-y-3">
        {lines.map((line, idx) => {
          const showTr = showTranslations[line.id];
          return (
            <div key={line.id} className="rounded-xl bg-card border border-border p-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-base font-medium text-foreground leading-relaxed">{tokenize(line.spanish_text)}</p>
                {line.english_translation && (
                  <button
                    onClick={() => setShowTranslations((s) => ({ ...s, [line.id]: !s[line.id] }))}
                    className="text-xs text-primary flex-shrink-0 mt-0.5"
                  >
                    {showTr ? 'Hide' : 'EN'}
                  </button>
                )}
              </div>
              {showTr && line.english_translation && (
                <p className="text-sm text-muted-foreground mb-1">{line.english_translation}</p>
              )}
              {line.pronunciation && (
                <p className="text-xs text-primary/70">🔊 {line.pronunciation}</p>
              )}
            </div>
          );
        })}
      </div>

      {showNudge && (
        <div className="mt-3 text-xs text-center text-muted-foreground">
          Tip: tap words you don't know before moving on
        </div>
      )}

      {savedFlash && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg animate-checkmark">
          Saved ✓
        </div>
      )}

      <button
        onClick={onReady}
        className="mt-4 w-full h-12 rounded-xl bg-primary text-white font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
      >
        I'm ready for the quiz <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}