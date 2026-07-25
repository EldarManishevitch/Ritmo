import React, { useEffect, useState, useRef } from 'react';
import { Music2 } from 'lucide-react';
import { useUpdateUserProgress } from '@/data/hooks/useUserProgress';
import { PICKER_GENRES, genreColor, genreLabel } from '@/lib/genres';
import { getProgress } from '@/lib/progress';

export default function GenrePreferencesCard() {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef(null);
  const progressIdRef = useRef(null);
  const updateUserProgress = useUpdateUserProgress();

  useEffect(() => {
    getProgress()
      .then((p) => {
        setGenres(Array.isArray(p?.fav_genres) ? p.fav_genres : []);
        progressIdRef.current = p?.id;
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (genre) => {
    const newGenres = genres.includes(genre)
      ? genres.filter((g) => g !== genre)
      : [...genres, genre];
    setGenres(newGenres);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        if (progressIdRef.current) {
          await updateUserProgress.mutateAsync({ id: progressIdRef.current, patch: { fav_genres: newGenres } });
        }
      } catch { /* noop */ }
    }, 500);
  };

  if (loading) {
    return <div className="rounded-2xl bg-card border border-border p-5 mb-4 animate-pulse h-32" />;
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-5 mb-4">
      <div className="flex items-center gap-2 mb-1">
        <Music2 className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Music preferences</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Genres you're learning from — we'll recommend songs and daily lessons from these first.
      </p>
      <div className="flex flex-wrap gap-2">
        {PICKER_GENRES.map((g) => {
          const isActive = genres.includes(g);
          const c = genreColor(g);
          return (
            <button
              key={g}
              onClick={() => handleToggle(g)}
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
    </div>
  );
}