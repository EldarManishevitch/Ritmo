import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, Star, RotateCcw, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { normalizeSpanish } from '@/lib/pronunciationScore';
import PronunciationKaraoke from '@/components/song/PronunciationKaraoke';
import GrammarInsight from '@/components/song/GrammarInsight';

export default function SyncedLyrics({
  lines = [],
  currentTime = 0,
  duration = 0,
  offset = 0,
  mode = 'synced',
  displayMode = 'both',
  onWordTap,
  onLineSeek,
  onPausePlayer,
  onResync,
  syncDisabled = false,
  loading = false,
  playbackStarted = false,
  tutorialTargetWord = null,
  tutorialActive = false,
  grammarPulseStep = false,
  grammarBadge = false,
  onGrammarOpen,
}) {
  const containerRef = useRef(null);
  const [karaokeResults, setKaraokeResults] = useState({});
  
  // Derived UI state directly from props — the backend (pipeline) marks ready when lyrics are
  // fully translated and saved with zero-placeholder timestamps. Sync mode (seek/highlight) only
  // activates when real >0 timestamps exist. This matches the template's static-first approach.
  const hasSyncTimestamps = lines.some((l) => (l.start_seconds || 0) > 0);
  const hasTranslations = lines.some((l) => l.english_translation);
  const isSynced = lines.length > 0 && mode !== 'static' && hasSyncTimestamps;
  const adjustedTime = currentTime + offset;

  // Issue 2c: unsynced songs (ready_unsynced / static) have start_seconds=0 on
  // every line — the real-timestamp loop finds no active line. Fall back to
  // time-based estimation: divide duration evenly across lines.
  const allZeroTimestamps = lines.length > 0 && lines.every((l) => (l.start_seconds || 0) === 0);
  const useEstimatedSync = !isSynced && allZeroTimestamps && duration > 0 && lines.length > 0;

  let activeIndex = -1;
  if (isSynced) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.start_seconds <= adjustedTime && adjustedTime < (line.end_seconds || line.start_seconds + 5)) {
        activeIndex = i;
      }
    }
    if (activeIndex === -1 && lines.length && adjustedTime >= lines[0].start_seconds) {
      for (let i = lines.length - 1; i >= 0; i--) {
        if (adjustedTime >= lines[i].start_seconds) { activeIndex = i; break; }
      }
    }
  } else if (useEstimatedSync) {
    const secondsPerLine = duration / lines.length;
    activeIndex = Math.min(lines.length - 1, Math.floor(adjustedTime / secondsPerLine));
  }

  const activeLineId = activeIndex >= 0 ? (lines[activeIndex]?.id || `line-${activeIndex}`) : null;

  useEffect(() => {
    if ((!isSynced && !useEstimatedSync) || !activeLineId || !containerRef.current) return;
    const el = containerRef.current.querySelector(`[data-line-id="${activeLineId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLineId, isSynced, useEstimatedSync]);

  const handleKaraokeResult = (lineId, result) => {
    setKaraokeResults((prev) => ({ ...prev, [lineId]: result }));
  };

  const clearKaraoke = (lineId) => {
    setKaraokeResults((prev) => {
      const next = { ...prev };
      delete next[lineId];
      return next;
    });
  };

  const renderWords = (text, lineText, karaokeResult, disabled) => {
    return text.split(/(\s+)/).map((token, i) => {
      if (/^\s+$/.test(token)) return token;
      const clean = token.replace(/[^a-záéíóúüñ]/gi, '');
      if (!clean) return token;
      if (disabled) {
        return (
          <span key={i} className="text-muted-foreground/40">
            {token}
          </span>
        );
      }
      if (karaokeResult) {
        const normalized = normalizeSpanish(clean);
        const isCorrect = karaokeResult.correctSet.has(normalized);
        const isMissed = karaokeResult.missedSet.has(normalized);
        return (
          <span
            key={i}
            className={`transition-all duration-300 ${
              isCorrect
                ? 'text-green-600 font-semibold'
                : isMissed
                ? 'text-red-500 line-through bg-red-100 text-red-600 px-1 rounded'
                : 'text-foreground'
            }`}
          >
            {token}
          </span>
        );
      }
      const isTutorialTarget = tutorialActive && tutorialTargetWord && clean === tutorialTargetWord;
      return (
        <span key={i} className="relative inline-block">
          {isTutorialTarget && (
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-sm animate-bounce pointer-events-none select-none">
              👆
            </span>
          )}
          <button
            type="button"
            onClick={() => onWordTap?.(clean, lineText)}
            className={`inline-block transition-colors hover:text-primary hover:underline decoration-primary/40 underline-offset-2 ${
              isTutorialTarget ? 'ring-2 ring-primary rounded bg-primary/10 px-1 animate-pulse font-semibold' : ''
            }`}
          >
            {token}
          </button>
        </span>
      );
    });
  };

  if (!lines.length) {
    if (loading) {
      return (
        <div className="h-full overflow-y-auto px-4 py-6 space-y-3 no-scrollbar">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-2xl border-2 border-transparent px-4 py-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2 mt-2" />
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        No lyrics yet.
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`overflow-y-auto px-4 py-6 space-y-3 no-scrollbar ${lines.length > 40 ? 'max-h-[560px]' : 'h-full'}`}>
      {/* Static mode banner + manual resync */}
      {mode === 'static' && lines.length > 0 && !hasSyncTimestamps && (
        <div className="mb-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 flex items-start justify-between gap-2">
          <div className="text-xs">
            <p className="font-semibold text-amber-700">📄 Static lyrics</p>
            <p className="text-amber-600/80 mt-0.5">No timestamps available — scroll manually. Clean audio timestamps couldn't be found.</p>
          </div>
          {onResync && (
            <button
              type="button"
              onClick={() => onResync()}
              className="flex-shrink-0 text-xs font-semibold text-amber-700 underline hover:no-underline mt-1"
            >
              Re-sync this song
            </button>
          )}
        </div>
      )}

      {/* Estimated sync badge — unsynced songs use time-based line estimation */}
      {useEstimatedSync && (
        <div className="mb-3 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 flex items-start gap-2">
          <span className="text-sm flex-shrink-0">⚡</span>
          <div className="text-xs">
            <p className="font-semibold text-blue-700">Estimated sync</p>
            <p className="text-blue-600/80 mt-0.5">Approximate line timing — no exact timestamps found for this song. Read along and tap words to learn.</p>
          </div>
        </div>
      )}

      {/* Sync banner — only when timestamps are actively pending (not in estimated mode) */}
      {!hasSyncTimestamps && !useEstimatedSync && lines.length > 0 && (
        <div className="mb-3 rounded-lg bg-orange-50 border border-orange-200 px-3 py-2 flex items-start gap-2">
          <Loader2 className="h-4 w-4 text-orange-600 mt-0.5 animate-spin flex-shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-orange-700">⏱️ Syncing lyrics to video...</p>
            <p className="text-orange-600/80 mt-0.5">Lyrics loaded! We're calibrating timestamps to the video. You can read along manually meanwhile.</p>
          </div>
        </div>
      )}

      {/* Translation banner */}
      {!hasTranslations && lines.length > 0 && (
        <div className="mb-3 rounded-lg bg-purple-50 border border-purple-200 px-3 py-2 flex items-start gap-2">
          <Loader2 className="h-4 w-4 text-purple-600 mt-0.5 animate-spin flex-shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-purple-700">🌐 Translating lyrics...</p>
            <p className="text-purple-600/80 mt-0.5">English translations are being generated. Original Spanish lyrics are ready below.</p>
          </div>
        </div>
      )}

      {lines.map((line, idx) => {
        const active = (isSynced || useEstimatedSync) && idx === activeIndex;
        const isInstrumental = !line.spanish_text || line.spanish_text.trim().length < 2;
        const lineKey = line.id || `line-${idx}`;
        const karaokeResult = karaokeResults[lineKey];

        if (isInstrumental) {
          return (
            <div key={lineKey} className="flex justify-center">
              <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                Instrumental...
              </span>
            </div>
          );
        }

        return (
          <motion.div
            key={lineKey}
            data-line-id={lineKey}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(idx * 0.04, 0.4) }}
            onClick={() => hasSyncTimestamps && onLineSeek?.(line.start_seconds - offset)}
            className={`rounded-2xl px-4 py-3 transition-all duration-300 relative ${
              active
                ? 'border-2 border-[#6C6BD4] bg-white font-bold text-[#23252F] scale-[1.02] shadow-md will-change-transform'
                : hasSyncTimestamps
                ? 'border-2 border-transparent opacity-70 hover:opacity-90'
                : 'border-2 border-transparent opacity-100'
            } ${hasSyncTimestamps ? 'cursor-pointer' : ''}`}
          >
            {(displayMode === 'spanish' || displayMode === 'both') && (
              <p
                className={`font-medium leading-snug transition-all duration-300 ${
                  active ? 'text-[#23252F] text-lg font-bold' : 'text-foreground text-base'
                }`}
              >
                {renderWords(line.spanish_text, line.spanish_text, karaokeResult, !line.english_translation)}
              </p>
            )}
            {(displayMode === 'english' || displayMode === 'both') && (
              line.english_translation ? (
                <p className={`text-sm mt-1 transition-opacity duration-300 ${active ? 'text-[#23252F]/80' : 'text-muted-foreground'}`}>
                  {line.english_translation}
                </p>
              ) : (
                displayMode !== 'spanish' && <div className="h-4 w-2/3 bg-muted animate-pulse rounded mt-1" />
              )
            )}
            {active && line.pronunciation && (
              <p className="text-xs text-muted-foreground/70 mt-1 italic flex items-center gap-1">
                <Volume2 className="h-3 w-3" /> /{line.pronunciation}/
              </p>
            )}

            <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
              {hasSyncTimestamps ? (
                <PronunciationKaraoke
                  lineId={lineKey}
                  targetText={line.spanish_text}
                  onPausePlayer={onPausePlayer}
                  onResult={handleKaraokeResult}
                />
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (typeof window === 'undefined' || !window.speechSynthesis) return;
                    window.speechSynthesis.cancel();
                    const u = new SpeechSynthesisUtterance(line.spanish_text);
                    u.lang = 'es-ES';
                    u.rate = 0.85;
                    window.speechSynthesis.speak(u);
                  }}
                  className="flex items-center justify-center h-7 w-7 rounded-full bg-muted text-muted-foreground hover:bg-primary/15 hover:text-primary transition-all duration-300 flex-shrink-0"
                  title="Play line"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                </button>
              )}
              {playbackStarted && (
                <GrammarInsight
                  line={line}
                  showBadge={grammarBadge}
                  pulse={grammarPulseStep && active}
                  onOpen={onGrammarOpen}
                />
              )}
              {karaokeResult && (
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">
                    <Star className="h-3 w-3 fill-primary" />
                    {karaokeResult.score}/100
                  </span>
                  <button
                    type="button"
                    onClick={() => clearKaraoke(lineKey)}
                    className="flex items-center justify-center h-6 w-6 rounded-full text-muted-foreground hover:bg-muted transition-colors"
                    title="Clear score"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}