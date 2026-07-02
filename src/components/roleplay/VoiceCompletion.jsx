import React from 'react';
import { RefreshCw, Home, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function barColor(score) {
  if (score >= 85) return 'bg-green-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

export default function VoiceCompletion({ results, xp, avg, onNewScene, onHome }) {
  const understoodCount = results.filter((r) => r.understood).length;

  const handleShare = async () => {
    const text = `🎙️ I just finished a Spanish voice conversation on Ritmo — ${avg}% average, +${xp} XP!`;
    try {
      if (navigator.share) await navigator.share({ title: 'Ritmo Voice Coach', text });
      else await navigator.clipboard.writeText(text);
    } catch { /* cancelled */ }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm overflow-y-auto p-4">
      <div className="max-w-md mx-auto pt-8 pb-16 text-center">
        <div className="text-5xl mb-2">🎙️</div>
        <h2 className="text-2xl font-bold text-foreground">¡Conversación completa!</h2>
        <p className="text-sm text-muted-foreground mt-1">You held a full Spanish conversation out loud.</p>

        <div className="flex items-center justify-center gap-6 my-6">
          <div>
            <p className="text-3xl font-bold text-primary">{avg}%</p>
            <p className="text-xs text-muted-foreground">Avg score</p>
          </div>
          <div className="w-px h-10 bg-border" />
          <div>
            <p className="text-3xl font-bold text-primary">+{xp}</p>
            <p className="text-xs text-muted-foreground">XP earned</p>
          </div>
          <div className="w-px h-10 bg-border" />
          <div>
            <p className="text-3xl font-bold text-primary">{understoodCount}/{results.length}</p>
            <p className="text-xs text-muted-foreground">Understood</p>
          </div>
        </div>

        {/* Turn-by-turn bar chart */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-6 text-left">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Turn by turn</p>
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-12 flex-shrink-0">Turn {i + 1}</span>
                <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${barColor(r.score)}`} style={{ width: `${Math.max(4, r.score)}%` }} />
                </div>
                <span className="text-xs font-semibold text-foreground w-9 text-right">{r.skipped ? '—' : `${r.score}%`}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={handleShare} className="w-full">
            <Share2 className="h-4 w-4 mr-1" /> Share
          </Button>
          <Button onClick={onNewScene} className="w-full">
            <RefreshCw className="h-4 w-4 mr-1" /> New scene
          </Button>
          <Button variant="ghost" onClick={onHome} className="w-full">
            <Home className="h-4 w-4 mr-1" /> Back to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}