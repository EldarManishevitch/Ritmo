import React from 'react';
import { Loader2 } from 'lucide-react';

const STATUS_TEXT = {
  pending: 'Preparing your song…',
  fetching_lyrics: 'Fetching lyrics…',
  translating: 'Translating lines…',
};

export default function GenerationProgressPill({ status, visible }) {
  return (
    <div
      className={`pointer-events-none fixed top-14 left-1/2 -translate-x-1/2 z-40 transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex items-center gap-2 rounded-full bg-card border border-border shadow-lg px-4 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
        <span className="text-sm font-medium text-foreground whitespace-nowrap">
          🪄 {STATUS_TEXT[status] || 'AI is crafting your song…'}
        </span>
      </div>
    </div>
  );
}