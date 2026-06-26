import React, { useEffect, useState } from 'react';
import { Flame, Sparkles } from 'lucide-react';
import { getProgress, levelForXp } from '@/lib/progress';

export default function ProgressBadge() {
  const [p, setP] = useState(null);

  useEffect(() => {
    getProgress().then(setP).catch(() => {});
  }, []);

  if (!p) return null;
  const level = levelForXp(p.xp || 0);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5">
        <Flame className="h-4 w-4 text-primary" />
        <span className="text-sm font-bold text-foreground">{p.current_streak || 0} Days</span>
        <span className="text-xs text-muted-foreground">Best: {p.best_streak || 0}</span>
      </div>
      <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">{level.cefr} · {level.title}</span>
        <span className="text-xs text-muted-foreground">{p.xp || 0} XP</span>
      </div>
    </div>
  );
}