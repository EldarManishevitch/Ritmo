import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles, Lock, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { ACHIEVEMENTS, unlockedAchievementIds } from '@/lib/achievements';

export default function AchievementBadges() {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    base44.entities.UserProgress.list('-updated_date', 1)
      .then((list) => { if (!cancelled) setProgress(list[0] || null); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Unlocked = live-computed from current progress values + any persisted awards
  // (e.g. perfect_quiz, which needs event context not available here).
  const unlocked = useMemo(() => {
    const set = new Set(progress?.achievements || []);
    if (progress) unlockedAchievementIds(progress).forEach((id) => set.add(id));
    return set;
  }, [progress]);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Achievements</h2>
        <span className="text-xs text-muted-foreground">{unlocked.size}/{ACHIEVEMENTS.length} unlocked</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ACHIEVEMENTS.map((a) => {
          const isUnlocked = unlocked.has(a.id);
          return (
            <div
              key={a.id}
              className={`rounded-xl p-3 border transition-all ${
                isUnlocked
                  ? 'bg-primary/5 border-primary/30 shadow-sm'
                  : 'bg-muted/40 border-border opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xl">{isUnlocked ? a.icon : '🔒'}</span>
                {!isUnlocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
              <p className="text-sm font-semibold text-foreground">{a.label}</p>
              <p className="text-xs text-muted-foreground">{a.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}