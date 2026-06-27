import React, { useEffect, useState } from 'react';
import { Loader2, Check } from 'lucide-react';

const STATUS_TEXT = {
  pending: 'Preparing…',
  fetching_lyrics: 'Fetching lyrics & translating… ⏳',
  translating: 'Translating lines…',
};

// Target progress per status (kept below 100 while still working)
const STATUS_TARGET = {
  pending: 15,
  fetching_lyrics: 50,
  translating: 85,
  ready: 100,
  static: 100,
};

export default function GenerationProgressPill({ status, visible }) {
  const target = STATUS_TARGET[status] ?? 10;
  const [progress, setProgress] = useState(0);
  const [show, setShow] = useState(false);

  // Show as soon as generation is in progress
  useEffect(() => {
    if (visible) setShow(true);
  }, [visible]);

  // Ease the bar toward its target; once done, rush to 100%
  useEffect(() => {
    if (!show) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        const t = visible ? target : 100;
        if (p >= t) return p;
        const remaining = t - p;
        return p + Math.max(remaining * 0.18, 0.8);
      });
    }, 100);
    return () => clearInterval(interval);
  }, [show, visible, target]);

  // After reaching 100% on completion, fade out
  useEffect(() => {
    if (!visible && progress >= 100) {
      const t = setTimeout(() => setShow(false), 600);
      return () => clearTimeout(t);
    }
  }, [visible, progress]);

  const pct = Math.min(100, Math.round(progress));
  const done = !visible && pct >= 100;

  return (
    <div
      className={`pointer-events-none fixed top-14 left-1/2 -translate-x-1/2 z-40 transition-opacity duration-500 ${
        show ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex flex-col gap-1.5 rounded-2xl bg-card border border-border shadow-lg px-4 py-2.5 w-64">
        <div className="flex items-center gap-2">
          {done ? (
            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
          )}
          <span className="text-sm font-medium text-foreground whitespace-nowrap">
            {done ? 'Ready!' : `🪄 ${STATUS_TEXT[status] || 'AI is crafting your song…'}`}
          </span>
          <span className="text-xs font-semibold text-primary ml-auto">{pct}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-200 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}