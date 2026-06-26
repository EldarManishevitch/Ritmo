import React from 'react';
import { Link } from 'react-router-dom';
import { songCefr } from '@/lib/cefr';

const FALLBACK_ART = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=70';

export default function SongGridCard({ song, levelUp = false }) {
  const initialThumb = song.album_art_url || (song.youtube_id ? `https://i.ytimg.com/vi/${song.youtube_id}/mqdefault.jpg` : FALLBACK_ART);
  const [thumbnail, setThumbnail] = React.useState(initialThumb);
  const isPending = ['pending', 'fetching_lyrics', 'translating'].includes(song.sync_status);
  const cefr = songCefr(song.difficulty);

  return (
    <Link to={`/song/${song.id}`} className="block group">
      <div className="rounded-xl bg-card border border-border overflow-hidden shadow-sm transition-shadow hover:shadow-md">
        <div className="relative aspect-video overflow-hidden">
          <img
            src={thumbnail}
            alt={song.title}
            onError={() => { if (thumbnail !== FALLBACK_ART) setThumbnail(FALLBACK_ART); }}
            className={`w-full h-full object-cover ${isPending ? 'blur-sm opacity-60' : ''}`}
          />
          <div className="absolute top-2 right-2 flex flex-col gap-1.5 items-end">
            {song.genre && (
              <span className="text-[10px] font-semibold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: '#2A4B62' }}>
                {song.genre}
              </span>
            )}
            <span className="text-[10px] font-semibold text-foreground px-2 py-0.5 rounded-full bg-white/90">
              {levelUp ? `LEVEL UP · ${cefr}` : cefr}
            </span>
          </div>
          {isPending && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50">
              <span className="text-xs font-medium text-[#CC4E3C]">Checking version...</span>
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-bold text-sm text-foreground truncate">{song.title}</h3>
          <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
        </div>
      </div>
    </Link>
  );
}