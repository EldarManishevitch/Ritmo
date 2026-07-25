import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { getProgress } from '@/lib/progress';
import { unlockedAchievementIds, achievementById } from '@/lib/achievements';
import confetti from 'canvas-confetti';

export default function MilestoneCelebration() {
  const [newOnes, setNewOnes] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await base44.auth.me();
        const key = `milestone_last_seen_${me?.id || 'anon'}`;
        const progress = (await getProgress()) || {};
        const unlocked = unlockedAchievementIds(progress);
        const hadKey = localStorage.getItem(key) !== null;
        const lastSeen = hadKey ? JSON.parse(localStorage.getItem(key) || '[]') : unlocked;
        localStorage.setItem(key, JSON.stringify(unlocked));
        if (cancelled) return;
        const fresh = hadKey ? unlocked.filter((id) => !lastSeen.includes(id)) : [];
        if (fresh.length) {
          setNewOnes(fresh.map(achievementById).filter(Boolean));
          fireConfetti();
        }
      } catch { /* noop */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const fireConfetti = () => {
    const end = Date.now() + 1200;
    const colors = ['#f59e0b', '#fb7185', '#22c55e', '#3b82f6'];
    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 70, origin: { x: 0 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  };

  if (!newOnes.length) return null;

  const close = () => setNewOnes([]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={close}>
      <div
        className="bg-card rounded-3xl border border-border shadow-2xl p-8 max-w-sm w-full text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-6xl mb-3">{newOnes[0].icon}</div>
        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Milestone unlocked!</p>
        <h2 className="text-2xl font-bold text-foreground mb-1">{newOnes[0].label}</h2>
        <p className="text-sm text-muted-foreground mb-5">{newOnes[0].desc}</p>
        {newOnes.length > 1 && (
          <p className="text-xs text-muted-foreground mb-4">
            +{newOnes.length - 1} more milestone{newOnes.length > 2 ? 's' : ''} unlocked
          </p>
        )}
        <button
          onClick={close}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          Keep going 🎉
        </button>
      </div>
    </div>
  );
}