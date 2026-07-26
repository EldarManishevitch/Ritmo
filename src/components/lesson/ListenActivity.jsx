import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { translateWordCached } from '@/lib/aiHelpers';
import { addTappedWord } from '@/lib/dailyLesson';
import { savedWordsRepo } from '@/data/repositories/savedWords.repo';
import SyncedLyrics from '@/components/song/SyncedLyrics';

export default function ListenActivity({ lesson, lines, onReady }) {
  const [tapped, setTapped] = useState(new Set(lesson.words_tapped || []));
  const [savedFlash, setSavedFlash] = useState(null);
  const [displayMode, setDisplayMode] = useState('both');
  const playerContainerId = 'lesson-yt-player';
  const nudgeTimer = useRef(null);

  const { ready, isPlaying, currentTime, seekTo, pause } = useYouTubePlayer(lesson.song_youtube_id || '', playerContainerId);

  // 90s nudge
  useEffect(() => {
    if (!isPlaying) return;
    nudgeTimer.current = setTimeout(() => setShowNudge(true), 90000);
    return () => clearTimeout(nudgeTimer.current);
  }, [isPlaying]);
  const [showNudge, setShowNudge] = useState(false);

  const handleWordTap = async (word) => {
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

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* YouTube player */}
      <div className="relative bg-black aspect-video flex-shrink-0">
        <div id={playerContainerId} className="w-full h-full" />
        {!ready && <div className="absolute inset-0 flex items-center justify-center bg-black"><div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>}
      </div>

      {/* Language toggle — matches the song page */}
      <div className="px-4 py-2 flex items-center justify-end border-b border-border">
        <div className="flex rounded-full bg-muted p-0.5">
          {[
            { id: 'spanish', label: 'ES' },
            { id: 'both', label: 'ES/EN' },
            { id: 'english', label: 'EN' },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setDisplayMode(opt.id)}
              className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                displayMode === opt.id ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chorus lines — same component the full song page uses */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <SyncedLyrics
          lines={lines}
          currentTime={currentTime}
          displayMode={displayMode}
          onWordTap={handleWordTap}
          onLineSeek={seekTo}
          onPausePlayer={pause}
        />
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

      <div className="px-4 py-3 border-t border-border flex-shrink-0">
        <button
          onClick={onReady}
          className="w-full h-12 rounded-xl bg-primary text-white font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
        >
          I'm ready for the quiz <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}