import React from 'react';
import { PICKER_GENRES, genreColor, genreLabel } from '@/lib/genres';

export default function GenrePicker({ selected = [], onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PICKER_GENRES.map((g) => {
        const isActive = selected.includes(g);
        const c = genreColor(g);
        return (
          <button
            key={g}
            onClick={() => onToggle(g)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              isActive
                ? `${c.solid} text-white`
                : 'bg-muted text-muted-foreground hover:bg-muted/70 border border-border'
            }`}
          >
            {genreLabel(g)}
          </button>
        );
      })}
    </div>
  );
}