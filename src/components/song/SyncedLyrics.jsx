import React, { useEffect, useRef, useState } from 'react';
import { Volume2, Star, RotateCcw } from 'lucide-react';
import { normalizeSpanish } from '@/lib/pronunciationScore';
import PronunciationKaraoke from '@/components/song/PronunciationKaraoke';
import GrammarInsight from '@/components/song/GrammarInsight';

export default function SyncedLyrics({
  lines = [],
  currentTime = 0,
  offset = 0,
  mode = 'synced',
  showEnglish = true,
  onWordTap,
  onLineSeek,
  onPausePlayer,
}) {
  const containerRef = useRef(null);
  const [karaokeResults, setKaraokeResults] = useState({});
  // Three-state UI: lyrics render immediately; a background check resolves to synced/static
  const [syncStatus, setSyncStatus] = useState('checking');

  // Background sync checker: resolve once lyrics are present and timestamps can be verified
  useEffect(() => {
    if (!lines.length) return; // keep checking until lyrics render
    const timer = setTimeout(() => {
      const hasTimestamps = lines.some((l) => (l.start_seconds || 0) > 0);
      if (hasTimestamps) {
        setSyncStatus('synced');
      } else if (mode === 'static') {
        setSyncStatus('static');
      }
      // else: timestamps may still arrive via realtime updates — keep checking
    }, 500);
    return () => clearTimeout(timer);
  }, [lines, mode]);

  const isSynced = syncStatus === 'synced';
  const adjustedTime = currentTime + offset;

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
  }

  const activeLineId = activeIndex >= 0 ? (lines[activeIndex]?.id || `line-${activeIndex}`) : null;

  useEffect(() => {
    if (!isSynced || !activeLineId || !containerRef.current) return;
    const el = containerRef.current.querySelector(`[data-line-id="${activeLineId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLineId, isSynced]);

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

  const renderWords = (text, lineText, karaokeResult) => {
    return text.split(/(\s+)/).map((token, i) => {
      if (/^\s+$/.test(token)) return token;
      const clean = token.replace(/[^a-záéíóúüñ]/gi, '');
      if (!clean) return token;
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
      return (
        <button
          key={i}
          type="button"
          onClick={() => onWordTap?.(clean, lineText)}
          className="inline-block transition-colors hover:text-primary hover:underline decoration-primary/40 underline-offset-2"
        >
          {token}
        </button>
      );
    });
  };

  if (!lines.length) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        No lyrics yet.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto px-4 py-6 space-y-3 no-scrollbar">
      {/* Static fallback message */}
      {syncStatus === 'static' && (
        <div className="flex justify-center mb-2">
          <span className="text-xs text-muted-foreground">
            Static lyrics — sync unavailable for this track
          </span>
        </div>
      )}

      {lines.map((line, idx) => {
        const active = isSynced && idx === activeIndex;
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
          <div
            key={lineKey}
            data-line-id={lineKey}
            onClick={() => isSynced && onLineSeek?.(line.start_seconds - offset)}
            className={`rounded-2xl px-4 py-3 transition-all duration-300 relative ${
              active
                ? 'border-2 border-[#D96B43] bg-white font-bold text-[#2C2A29] scale-[1.02] shadow-md'
                : isSynced
                ? 'border-2 border-transparent opacity-70 hover:opacity-90'
                : 'border-2 border-transparent opacity-100'
            } ${isSynced ? 'cursor-pointer' : ''}`}
          >
            <p
              className={`font-medium leading-snug transition-all duration-300 ${
                active ? 'text-[#2C2A29] text-lg font-bold' : 'text-foreground text-base'
              }`}
            >
              {renderWords(line.spanish_text, line.spanish_text, karaokeResult)}
            </p>
            {showEnglish && (
              line.english_translation ? (
                <p className={`text-sm mt-1 transition-opacity duration-300 ${active ? 'text-[#2C2A29]/80' : 'text-muted-foreground'}`}>
                  {line.english_translation}
                </p>
              ) : (
                <div className="h-4 w-2/3 bg-muted animate-pulse rounded mt-1" />
              )
            )}
            {active && line.pronunciation && (
              <p className="text-xs text-muted-foreground/70 mt-1 italic flex items-center gap-1">
                <Volume2 className="h-3 w-3" /> /{line.pronunciation}/
              </p>
            )}

            {/* Action tray: pronunciation mic + grammar insight + score badge */}
            <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
              <PronunciationKaraoke
                lineId={lineKey}
                targetText={line.spanish_text}
                onPausePlayer={onPausePlayer}
                onResult={handleKaraokeResult}
              />
              <GrammarInsight line={line} />
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
          </div>
        );
      })}
    </div>
  );
}