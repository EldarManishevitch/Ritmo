import React from 'react';

/** CSS-only animated bars used for "Speaking…" and "Listening…" states. */
export default function ListeningBars({ color = 'bg-primary' }) {
  return (
    <div className="flex items-end gap-1 h-5">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`w-1 rounded-full ${color} animate-pulse`}
          style={{
            height: `${8 + ((i % 3) * 6)}px`,
            animationDelay: `${i * 120}ms`,
            animationDuration: '700ms',
          }}
        />
      ))}
    </div>
  );
}