import React, { useState } from 'react';
import { Music } from 'lucide-react';

// YouTube serves a valid (HTTP 200) but blank 120×90 placeholder image for
// video IDs with no thumbnail at this size, instead of a 404 — a plain
// onError handler can't catch that case, so we also check the loaded
// image's natural width and treat that exact size as "no real thumbnail".
const YOUTUBE_BLANK_WIDTH = 120;

/**
 * Drop-in <img> replacement for song thumbnails. Falls back to a local,
 * network-independent placeholder (never itself capable of failing to load)
 * instead of chaining to another external URL.
 */
export default function SongThumbnail({ song, className = '', imgClassName }) {
  const src = song.album_art_url || (song.youtube_id ? `https://i.ytimg.com/vi/${song.youtube_id}/mqdefault.jpg` : null);
  const [broken, setBroken] = useState(!src);

  if (broken) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-muted to-muted/70 ${className}`}>
        <Music className="h-1/3 w-1/3 text-muted-foreground/40" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={song.title}
      className={imgClassName || className}
      onError={() => setBroken(true)}
      onLoad={(e) => { if (e.currentTarget.naturalWidth === YOUTUBE_BLANK_WIDTH) setBroken(true); }}
    />
  );
}
