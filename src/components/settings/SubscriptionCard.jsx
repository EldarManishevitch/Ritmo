import React from 'react';
import { Sparkles } from 'lucide-react';

export default function SubscriptionCard() {
  return (
    <div className="rounded-2xl bg-card border border-border p-5 mb-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Subscription</h2>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full flex items-center justify-center bg-primary text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Everything's free</p>
          <p className="text-xs text-muted-foreground">All features are unlocked for every user — no subscription needed</p>
        </div>
      </div>
    </div>
  );
}