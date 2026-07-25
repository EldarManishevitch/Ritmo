import React from 'react';
import { Link } from 'react-router-dom';
import { songCefrLevel } from '@/lib/cefr';
import { prefetchSong } from '@/lib/songCache';
import SongThumbnail from '@/components/song/SongThumbnail';

export default function SongGridCard({ song, levelUp = false }) {
  const isPending = ['pending', 'fetching_lyrics', 'translating'].includes(song.sync_status);
  const cefr = songCefrLevel(song);

  return (
    <Link to={`/song/${song.id}`} className="block group" onMouseEnter={() => prefetchSong(song.id)} onFocus={() => prefetchSong(song.id)}>
      <div className="rounded-xl bg-card border border-border overflow-hidden shadow-sm transition-shadow hover:shadow-md">
        <div className="relative aspect-video overflow-hidden">
          <SongThumbnail
            song={song}
            className={`w-full h-full object-cover ${isPending ? 'blur-sm opacity-60' : ''}`}
          />
          <div className="absolute top-2 right-2 flex flex-col gap-1.5 items-end">
            {song.genre && (
              <span className="text-[10px] font-semibold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: '#B0801F' }}>
                {song.genre}
              </span>
            )}
            <span className="text-[10px] font-semibold text-foreground px-2 py-0.5 rounded-full bg-white/90">
              {levelUp ? `LEVEL UP · ${cefr}` : cefr}
            </span>
          </div>
          {isPending && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50">
              <span className="text-xs font-medium text-[#4A4AA8]">Checking version...</span>
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