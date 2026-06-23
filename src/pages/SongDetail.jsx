import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Play, Pause, Music, Zap, Languages } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import WordTapper from '@/components/song/WordTapper';
import { motion } from 'framer-motion';

export default function SongDetail() {
  const { id } = useParams();
  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.Song.get(id);
        setSong(data);
      } catch (e) {}
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="px-5 pt-14 pb-4">
          <div className="h-6 w-6 rounded bg-muted animate-pulse" />
        </div>
        <div className="px-5 space-y-4">
          <div className="aspect-video rounded-2xl bg-muted animate-pulse" />
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-muted/60 flex items-center justify-center">
          <Music className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="font-semibold text-lg">Song not found</h2>
        <Link to="/" className="text-sm text-primary font-medium hover:underline">Go back home</Link>
      </div>
    );
  }

  const thumbnail = song.thumbnail_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80';

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-5 pt-14 pb-3 flex items-center gap-3">
        <Link to="/" className="h-9 w-9 rounded-xl bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors">
          <ArrowLeft className="h-4.5 w-4.5" />
        </Link>
        <span className="text-sm font-medium text-muted-foreground">Now Learning</span>
      </div>

      <div className="px-5 pb-8 space-y-6">
        {/* Song Hero */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="relative rounded-2xl overflow-hidden shadow-lg">
            <div className="aspect-video relative">
              <img
                src={thumbnail}
                alt={`${song.title} by ${song.artist}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h1 className="text-white font-bold text-2xl mb-1">{song.title}</h1>
                <p className="text-white/80 text-sm">{song.artist}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <Badge variant="secondary" className="text-xs font-medium">{song.difficulty || 'A2'}</Badge>
            <Badge variant="outline" className="text-xs">{song.genre || 'Reggaeton'}</Badge>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground ml-auto">
              <Zap className="h-3 w-3 text-primary" />
              {song.preview_seconds || 10}s preview
            </span>
          </div>
        </motion.div>

        {/* Lyrics Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-card rounded-2xl border border-border/50 p-5"
        >
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
            <Languages className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Tap any word</span>
          </div>

          {song.lyrics_lines && song.lyrics_lines.length > 0 ? (
            <WordTapper
              lyricsLines={song.lyrics_lines}
              songId={song.id}
              songTitle={song.title}
            />
          ) : (
            <div className="text-center py-8 space-y-2">
              <p className="text-sm text-muted-foreground">No lyrics available for this song yet.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}