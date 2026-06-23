import React, { useEffect, useRef } from 'react';
import { Volume2 } from 'lucide-react';

export default function SyncedLyrics({
  lines = [],
  currentTime = 0,
  offset = 0,
  mode = 'synced', // 'synced' | 'static'
  onWordTap,
  onLineSeek,
}) {
  const containerRef = useRef(null);
  const activeRef = useRef(null);

  const adjustedTime = currentTime + offset;

  // Find active line index
  let activeIndex = -1;
  if (mode === 'synced') {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.start_seconds <= adjustedTime && adjustedTime < (line.end_seconds || line.start_seconds + 5)) {
        activeIndex = i;
      }
    }
    // If past the last line's start, keep last active
    if (activeIndex === -1 && lines.length && adjustedTime >= lines[0].start_seconds) {
      for (let i = lines.length - 1; i >= 0; i--) {
        if (adjustedTime >= lines[i].start_seconds) { activeIndex = i; break; }
      }
    }
  }

  // Auto-scroll active line into view
  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      const c = containerRef.current;
      const el = activeRef.current;
      const cRect = c.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const offsetWithin = elRect.top - cRect.top;
      const target = c.scrollTop + offsetWithin - cRect.height / 2 + elRect.height / 2;
      c.scrollTo({ top: target, behavior: 'smooth' });
    }
  }, [activeIndex]);

  const renderWords = (text, lineText) => {
    return text.split(/(\s+)/).map((token, i) => {
      if (/^\s+$/.test(token)) return token;
      const clean = token.replace(/[^a-záéíóúüñ]/gi, '');
      if (!clean) return token;
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
      {lines.map((line, idx) => {
        const active = idx === activeIndex;
        return (
          <div
            key={line.id || idx}
            ref={active ? activeRef : null}
            onClick={() => mode === 'synced' && onLineSeek?.(line.start_seconds - offset)}
            className={`rounded-2xl px-4 py-3 transition-all duration-300 ${
              active
                ? 'bg-primary/10 border-l-4 border-primary scale-[1.02]'
                : 'border-l-4 border-transparent opacity-60 hover:opacity-90'
            } ${mode === 'synced' ? 'cursor-pointer' : ''}`}
          >
            <p
              className={`font-medium leading-snug ${
                active ? 'text-primary text-lg font-bold' : 'text-foreground text-base'
              }`}
            >
              {renderWords(line.spanish_text, line.spanish_text)}
            </p>
            {line.english_translation && (
              <p className={`text-sm mt-1 ${active ? 'text-foreground/80' : 'text-muted-foreground'}`}>
                {line.english_translation}
              </p>
            )}
            {active && line.pronunciation && (
              <p className="text-xs text-muted-foreground/70 mt-1 italic flex items-center gap-1">
                <Volume2 className="h-3 w-3" /> /{line.pronunciation}/
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}