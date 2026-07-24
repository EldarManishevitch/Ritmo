import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Zap, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { songCefr } from '@/lib/cefr';

export default function SongCard({ song, featured = false, locked = false }) {
  const thumbnail = song.album_art_url || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80`;

  if (featured) {
    return (
      <Link to={`/song/${song.id}`} className="block group">
        <div className="relative rounded-2xl overflow-hidden shadow-lg">
          <div className="aspect-video relative">
            <img
              src={thumbnail}
              alt={`${song.title} by ${song.artist}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                <Play className="h-7 w-7 text-white fill-white ml-0.5" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h3 className="text-white font-bold text-xl mb-1">{song.title}</h3>
              <p className="text-white/80 text-sm">{song.artist}</p>
            </div>
          </div>
          <div className="bg-card p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs font-medium">{songCefr(song.difficulty)}</Badge>
              <Badge variant="outline" className="text-xs">{song.genre || 'Reggaeton'}</Badge>
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Zap className="h-3 w-3 text-primary" />
              {song.preview_seconds || 10}s preview
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={locked ? '/pricing' : `/song/${song.id}`} className="block group">
      <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
        <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
          <img src={thumbnail} alt={song.title} className={`w-full h-full object-cover ${locked ? 'opacity-50' : ''}`} />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
            {locked ? <Lock className="h-4 w-4 text-white" /> : <Play className="h-4 w-4 text-white fill-white" />}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">{song.title}</h4>
          <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
        </div>
        {locked ? (
          <Badge className="text-[10px] font-medium flex-shrink-0 bg-primary text-white">Pro</Badge>
        ) : (
          <Badge variant="secondary" className="text-[10px] font-medium flex-shrink-0">
            {songCefr(song.difficulty)}
          </Badge>
        )}
      </div>
    </Link>
  );
}