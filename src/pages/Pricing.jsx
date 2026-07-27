import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/SEOHead';
import TopNav from '@/components/layout/TopNav';

const FEATURES = [
  'Daily lesson song',
  'Tap-to-translate lyrics',
  'Karaoke synced lyrics',
  'CEFR curriculum A1→C1',
  'Full song catalog access',
  'Unlimited saved vocabulary',
  'AI Voice Coach',
  'Roleplay voice mode',
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Pricing | Spanish Beats"
        description="Spanish Beats is completely free — every feature is unlocked for every user."
      />
      <TopNav />

      <div className="max-w-xl mx-auto px-4 pt-12 pb-16 text-center">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">Free, no catch</h1>
        <p className="text-muted-foreground mb-8">
          Spanish Beats doesn't have a paid tier. Every feature below is unlocked for every account.
        </p>

        <div className="rounded-2xl bg-card border border-border p-6 text-left mb-8">
          <ul className="space-y-2.5">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-foreground">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button asChild size="lg">
          <Link to="/dashboard">Start learning →</Link>
        </Button>
      </div>
    </div>
  );
}