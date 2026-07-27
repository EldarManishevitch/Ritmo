import React from 'react';
import { Languages } from 'lucide-react';
import { useCurrentWeekXp } from '@/data/hooks/useWeeklyXp';

/**
 * Reinforces tap-to-translate adoption (spec 3.4) by surfacing this week's
 * tap count on the dashboard — the feature is already learned in the first-song
 * tutorial, this just keeps it visible as an ongoing habit signal.
 */
export default function WordsTappedWidget() {
  const { data: weekXp, isLoading } = useCurrentWeekXp();
  const count = weekXp?.words_tapped || 0;

  if (isLoading || count === 0) return null;

  return (
    <div className="mb-4 rounded-2xl bg-card border border-border p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Languages className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="font-semibold text-foreground">{count} word{count === 1 ? '' : 's'} tapped this week</p>
        <p className="text-xs text-muted-foreground">Keep tapping unfamiliar words to build your vocabulary</p>
      </div>
    </div>
  );
}
