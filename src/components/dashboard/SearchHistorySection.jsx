import React from 'react';
import { Link } from 'react-router-dom';
import { Headphones } from 'lucide-react';
import { useSearchHistoryList } from '@/data/hooks/useSearchHistory';

export default function SearchHistorySection() {
  const { data: items = null } = useSearchHistoryList();

  if (items === null) return null;

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-foreground mb-1">🎧 Your Search History</h2>
      <p className="text-sm text-muted-foreground mb-4">Jump right back into songs you opened recently.</p>
      {items.length === 0 ? (
        <div className="rounded-xl bg-card border border-dashed border-border p-6 text-center">
          <Headphones className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Nothing here yet — open any song above and it'll show up here for quick access.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {items.map((h) => (
            <Link key={h.id} to={`/song/${h.song_id}`} className="block group">
              <div className="rounded-xl bg-card border border-border overflow-hidden shadow-sm transition-shadow hover:shadow-md">
                <div className="aspect-video overflow-hidden bg-muted">
                  <img
                    src={`https://img.youtube.com/vi/${h.song_youtube_id}/0.jpg`}
                    alt={h.song_title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-sm text-foreground truncate">{h.song_title}</h3>
                  <p className="text-xs text-muted-foreground truncate">{h.song_artist}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}