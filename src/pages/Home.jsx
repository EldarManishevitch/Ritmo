import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Music, Sparkles, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import SongCard from '@/components/song/SongCard';
import { motion } from 'framer-motion';

export default function Home() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.Song.list('-created_date', 20);
        setSongs(data);
      } catch (e) {
        // empty
      }
      setLoading(false);
    };
    load();
  }, []);

  const featured = songs.find(s => s.is_featured) || songs[0];
  const recent = songs.filter(s => s.id !== featured?.id).slice(0, 6);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-5 pt-14 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
            <Music className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Ritmo</h1>
        </div>
      </div>

      <div className="px-5 pt-4 pb-6 space-y-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-3"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-3 w-3" />
            Learn Spanish with music
          </span>
          <h2 className="text-3xl font-bold leading-tight">
            <span className="text-primary">Sing</span> the chorus.{'\n'}
            <br className="hidden sm:inline" />
            Speak the language.
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
            Tap any word in real song lyrics for instant pronunciation and English meaning. Learn naturally, one beat at a time.
          </p>
        </motion.div>

        {/* Featured Song */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-48 rounded-2xl bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-muted animate-pulse" />
              <div className="h-3 w-24 rounded bg-muted animate-pulse" />
            </div>
          </div>
        ) : featured ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                Featured
              </h3>
            </div>
            <SongCard song={featured} featured />
          </motion.div>
        ) : null}

        {/* Recent Songs */}
        {!loading && recent.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                More songs
              </h3>
              <Link to="/catalog" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
                See all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="bg-card rounded-2xl border border-border/50 divide-y divide-border/50">
              {recent.map(song => (
                <SongCard key={song.id} song={song} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {!loading && songs.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Music className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">No songs yet</h3>
            <p className="text-sm text-muted-foreground">Songs will appear here once they're added to the catalog.</p>
          </div>
        )}
      </div>
    </div>
  );
}