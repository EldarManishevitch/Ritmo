import React, { useState, useEffect } from 'react';
import { Mic, Volume2, SkipForward, Lightbulb, X, Loader2 } from 'lucide-react';
import ListeningBars from './ListeningBars';

export default function VoiceControls({
  phase, hintText, onMic, onReplay, onSkip, onCancel,
}) {
  const [hintRevealed, setHintRevealed] = useState(false);

  // Reset hint blur whenever we leave the user's turn
  useEffect(() => {
    if (phase !== 'user_turn') setHintRevealed(false);
  }, [phase]);

  if (phase === 'speaking') {
    return (
      <div className="flex items-center justify-center gap-3 py-4">
        <span className="text-sm font-medium text-primary flex items-center gap-2">
          🔊 Speaking… <ListeningBars color="bg-primary" />
        </span>
        <button onClick={onReplay} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
          <Volume2 className="h-3.5 w-3.5" /> Replay
        </button>
      </div>
    );
  }

  if (phase === 'evaluating') {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Evaluating…
      </div>
    );
  }

  if (phase === 'listening') {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="relative">
          <span className="absolute inset-0 rounded-full bg-red-500/40 animate-ping" />
          <div className="relative h-16 w-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
            <Mic className="h-7 w-7 text-white" />
          </div>
        </div>
        <span className="text-sm font-medium text-red-500 flex items-center gap-2">
          Listening… <ListeningBars color="bg-red-500" />
        </span>
        <button onClick={onCancel} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" /> Cancel
        </button>
      </div>
    );
  }

  // user_turn
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <button
        onClick={onMic}
        className="h-16 w-16 rounded-full bg-primary flex items-center justify-center shadow-lg hover:bg-primary/90 active:scale-95 transition-transform"
        title="Speak your reply"
      >
        <Mic className="h-7 w-7 text-white" />
      </button>
      <p className="text-xs text-muted-foreground">Tap to speak your reply</p>
      <div className="flex items-center gap-4">
        {hintText && (
          <button
            onClick={() => setHintRevealed(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <Lightbulb className="h-3.5 w-3.5" />
            {hintRevealed ? (
              <span className="text-foreground">{hintText}</span>
            ) : (
              <span className="blur-sm select-none">{hintText}</span>
            )}
          </button>
        )}
        <button onClick={onSkip} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
          <SkipForward className="h-3.5 w-3.5" /> Skip
        </button>
      </div>
    </div>
  );
}