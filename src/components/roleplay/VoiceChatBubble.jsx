import React, { useState } from 'react';
import { Volume2, Eye, EyeOff } from 'lucide-react';

function scoreColor(score) {
  if (score >= 85) return 'bg-green-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

export default function VoiceChatBubble({ message, onReplay }) {
  const [showTx, setShowTx] = useState(false);
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-accent/15 border border-accent/30 px-3.5 py-2.5">
          <p className="text-sm text-foreground">{message.text}</p>
          {typeof message.score === 'number' && (
            <span className={`inline-flex items-center mt-1.5 text-[11px] font-bold text-white px-2 py-0.5 rounded-full ${scoreColor(message.score)}`}>
              {message.score}%
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-primary/10 border border-primary/20 px-3.5 py-2.5">
        <p className="text-base font-semibold text-foreground leading-snug">{message.text}</p>
        {message.pronunciation && (
          <p className="text-xs italic text-muted-foreground mt-0.5">/{message.pronunciation}/</p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => onReplay?.(message.text)}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:opacity-80"
          >
            <Volume2 className="h-3.5 w-3.5" /> Replay
          </button>
          <button
            onClick={() => setShowTx((v) => !v)}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {showTx ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showTx ? 'Hide' : 'Show'} translation
          </button>
        </div>
        {showTx && message.translation && (
          <p className="text-sm text-muted-foreground mt-1.5">{message.translation}</p>
        )}
      </div>
    </div>
  );
}