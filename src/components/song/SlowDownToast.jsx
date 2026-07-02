import React from 'react';
import { X } from 'lucide-react';

export default function SlowDownToast({ visible, onQuickSet, onDismiss }) {
  if (!visible) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-sm">
      <div className="flex items-center gap-3 rounded-xl bg-card border border-border shadow-lg px-4 py-2.5">
        <p className="text-xs text-foreground flex-1">Struggling with this part? Try 0.75×</p>
        <button
          type="button"
          onClick={onQuickSet}
          className="text-xs font-semibold text-white bg-primary px-2.5 py-1 rounded-full hover:bg-primary/90 transition-colors"
        >
          0.75×
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}