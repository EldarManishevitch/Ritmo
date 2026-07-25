import React, { useState } from 'react';
import { Plus, Music } from 'lucide-react';
import { useGenreStatsList } from '@/data/hooks/useGenreStats';
import { PICKER_GENRES, genreColor, genreLabel } from '@/lib/genres';
import GenrePicker from './GenrePicker';

export default function GenreStatsWidget({ favGenres = [], onToggleGenre }) {
  const { data: stats = [], isLoading: loading } = useGenreStatsList();
  const [showPicker, setShowPicker] = useState(false);

  const statsMap = {};
  stats.forEach((s) => { statsMap[s.genre] = s; });

  const visibleGenres = PICKER_GENRES.filter((g) =>
    (statsMap[g]?.songs_completed || 0) > 0 || (statsMap[g]?.words_saved || 0) > 0 || favGenres.includes(g)
  );

  const maxXp = Math.max(1, ...stats.map((s) => s.total_xp || 0));

  if (loading) {
    return <div className="rounded-2xl bg-card border border-border p-5 mb-4 animate-pulse h-32" />;
  }

  if (visibleGenres.length === 0) {
    return (
      <div className="rounded-2xl bg-card border border-border p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Music className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">Pick your music taste</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Choose genres you love — we'll recommend songs from these first.</p>
        <GenrePicker selected={favGenres} onToggle={onToggleGenre} />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-foreground">Your genre stats</h2>
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          <Plus className="h-3 w-3" /> Add genre
        </button>
      </div>
      {showPicker && (
        <div className="mb-4">
          <GenrePicker selected={favGenres} onToggle={onToggleGenre} />
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {visibleGenres.map((g) => {
          const s = statsMap[g] || {};
          const c = genreColor(g);
          const xpPct = Math.round(((s.total_xp || 0) / maxXp) * 100);
          return (
            <div key={g} className="rounded-xl border border-border p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.solid} text-white`}>
                  {genreLabel(g)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                <span>{s.songs_completed || 0} songs</span>
                <span>{s.words_saved || 0} words</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${c.solid}`} style={{ width: `${xpPct}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{s.total_xp || 0} XP</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}