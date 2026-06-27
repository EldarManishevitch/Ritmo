import React, { useEffect, useState } from 'react';
import { Award, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { ACHIEVEMENTS, unlockedAchievementIds } from '@/lib/achievements';

export default function AchievementBadges() {
  const [unlocked, setUnlocked] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    base44.entities.UserProgress.list('-created_date', 1)
      .then((rows) => {
        if (cancelled) return;
        const p = rows[0] || {};
        setUnlocked(new Set(unlockedAchievementIds(p)));
      })
      .catch(() => { if (!cancelled) setUnlocked(new Set()); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const count = unlocked.size;

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Award className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Achievements</h3>
        <span className="text-xs text-muted-foreground ml-auto">{count}/{ACHIEVEMENTS.length} unlocked</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {ACHIEVEMENTS.map((a) => {
          const got = unlocked.has(a.id);
          return (
            <div
              key={a.id}
              className={`rounded-xl p-3 border text-center transition-all ${got ? 'bg-primary/5 border-primary/30' : 'bg-muted/40 border-border opacity-60'}`}
            >
              <div className="text-2xl mb-1">{got ? a.icon : '🔒'}</div>
              <p className="text-xs font-semibold text-foreground leading-tight">{a.label}</p>
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{a.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}