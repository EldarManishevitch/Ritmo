import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Check } from 'lucide-react';

const STATUS_TEXT = {
  pending: 'Preparing…',
  fetching_lyrics: 'Fetching lyrics & translating… ⏳',
  translating: 'Translating lines…',
};

export default function GenerationProgressPill({
  status,
  visible,
  songReady = false,
  lineCount = 0,
  translatedCount = 0,
  estimatedTotal = 40,
}) {
  const [progress, setProgress] = useState(0);
  const [show, setShow] = useState(false);

  // Compute the target progress from streaming signals
  const target = useMemo(() => {
    if (!visible) return 100;
    let t = 15; // jump to 15% instantly on load
    if (songReady) t = 35; // song record exists in DB
    const lineFrac = estimatedTotal > 0 ? Math.min(1, lineCount / estimatedTotal) : 0;
    t = Math.max(t, 35 + lineFrac * 45); // 35% → 80% as lines stream in
    if (lineCount > 0 && translatedCount >= lineCount) t = Math.max(t, 95); // all translated
    return Math.min(95, t);
  }, [visible, songReady, lineCount, translatedCount, estimatedTotal]);

  useEffect(() => { if (visible) setShow(true); }, [visible]);

  // Ease toward the target
  useEffect(() => {
    if (!show) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        const goal = visible ? target : 100;
        if (p >= goal) return p;
        const remaining = goal - p;
        return p + Math.max(remaining * 0.2, 1);
      });
    }, 100);
    return () => clearInterval(interval);
  }, [show, visible, target]);

  // After completion, hold 100% then fade out after a 1.5s quiet period
  useEffect(() => {
    if (!visible && progress >= 100) {
      const t = setTimeout(() => setShow(false), 1500);
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
            className="h-full rounded-full bg-primary"
            style={{ width: `${pct}%`, transition: 'width 600ms ease-out' }}
          />
        </div>
      </div>
    </div>
  );
}