import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';

/**
 * Confetti celebration modal shown when the user reaches a new CEFR level.
 * `level` is the level object { cefr, title } from levelForXp.
 */
export default function UnlockCelebration({ level, onClose }) {
  useEffect(() => {
    const end = Date.now() + 1200;
    const colors = ['#f59e0b', '#fb7185', '#22c55e', '#3b82f6'];
    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 70, origin: { x: 0 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-card rounded-3xl border border-border shadow-2xl p-8 max-w-sm w-full text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-6xl mb-3">🎉</div>
        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">¡Nivel nuevo!</p>
        <h2 className="text-2xl font-bold text-foreground mb-1">You've reached {level?.cefr}</h2>
        <p className="text-sm text-muted-foreground mb-5">{level?.title} · keep the rhythm going</p>
        <Button className="w-full" onClick={onClose}>¡Vamos! 🔥</Button>
      </div>
    </div>
  );
}