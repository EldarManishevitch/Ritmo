import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Centered feedback card.
 * understood=true → green (auto-dismisses upstream).
 * understood=false → amber with Try again / Skip (or Continue when forced).
 */
export default function VoiceFeedbackCard({ feedback, forced, onRetry, onSkip, onContinue }) {
  if (!feedback) return null;

  if (feedback.understood) {
    return (
      <div className="mx-auto max-w-sm rounded-2xl bg-green-500/10 border border-green-500/30 p-4 text-center">
        <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-1.5" />
        <p className="text-sm font-semibold text-green-700">{feedback.feedback_es}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-center">
      <AlertCircle className="h-6 w-6 text-amber-600 mx-auto mb-1.5" />
      <p className="text-sm font-semibold text-foreground mb-1">{feedback.feedback_en}</p>
      {feedback.feedback_es && <p className="text-xs text-muted-foreground mb-3">{feedback.feedback_es}</p>}
      {forced ? (
        <Button size="sm" className="w-full" onClick={onContinue}>Continue →</Button>
      ) : (
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={onRetry}>Try again</Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={onSkip}>Skip</Button>
        </div>
      )}
    </div>
  );
}