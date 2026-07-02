import React from 'react';

const RATES = [0.5, 0.75, 1, 1.25, 1.5];

export default function PlaybackSpeedSelector({ rate, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {RATES.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full transition-colors whitespace-nowrap ${
            rate === r
              ? 'bg-primary text-white'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          {r}×
        </button>
      ))}
    </div>
  );
}