import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { genreColor, genreLabel, READY_STATUSES } from '@/lib/genres';
import SongThumbnail from '@/components/song/SongThumbnail';

export default function CurriculumSongCard({ song }) {
  const isReady = READY_STATUSES.includes(song.sync_status);
  const gc = genreColor(song.genre);

  const card = (
    <div
      className="overflow-hidden transition-shadow hover:shadow-md"
      style={{ borderRadius: '10px', border: '0.5px solid hsl(var(--border))', background: 'hsl(var(--muted))' }}
    >
      <div className="relative aspect-video">
        <SongThumbnail song={song} className="w-full h-full object-cover" />
        <span className="absolute top-1.5 right-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/90 text-foreground">
          {song.cefr_level || 'A1'}
        </span>
        {song.grammar_anchor_note && (
          <span
            title={song.grammar_anchor_note}
            className="absolute top-1.5 left-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-primary text-white"
          >
            Anchor
          </span>
        )}
        {!isReady && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-[10px] font-medium text-white flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Generating...
            </span>
          </div>
        )}
      </div>
      <div className="p-2">
        <p
          className="font-medium leading-tight overflow-hidden text-foreground"
          style={{ fontSize: '13px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
        >
          {song.title}
        </p>
        <p className="text-muted-foreground truncate" style={{ fontSize: '11px' }}>{song.artist}</p>
        {song.grammar_anchor_note && (
          <p className="text-muted-foreground" style={{ fontSize: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {song.grammar_anchor_note}
          </p>
        )}
        {song.genre && (
          <span className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white ${gc.solid}`}>
            {genreLabel(song.genre)}
          </span>
        )}
      </div>
    </div>
  );

  if (!isReady) return card;
  return <Link to={`/song/${song.id}`}>{card}</Link>;
}