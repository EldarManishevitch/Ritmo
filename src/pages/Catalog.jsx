import React, { useState, useMemo } from 'react';
import { useSongsList } from '@/data/hooks/useSongs';
import { Search, Music, SlidersHorizontal } from 'lucide-react';
import SongCard from '@/components/song/SongCard';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useSubscription } from '@/hooks/useSubscription';
import { isSongReady } from '@/lib/genres';
import SEOHead from '@/components/SEOHead';

const GENRES = ['All', 'Reggaeton', 'Latin Pop', 'Bachata', 'Salsa', 'Trap'];
const LEVELS = ['All', 'A1', 'A2', 'B1', 'B2', 'C1'];

// Song.genre stores lowercase values that don't all match the display labels
// above 1:1 (e.g. 'Trap' vs 'trap latino').
const GENRE_TO_VALUE = {
  Reggaeton: 'reggaeton',
  'Latin Pop': 'pop latino',
  Bachata: 'bachata',
  Salsa: 'salsa',
  Trap: 'trap latino',
};

export default function Catalog() {
  const { data: songs = [], isLoading: loading } = useSongsList('-created_date', 50);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('All');
  const [level, setLevel] = useState('All');
  const { isPro } = useSubscription();

  const readySongs = useMemo(() => songs.filter(isSongReady), [songs]);

  const freeIds = useMemo(() => {
    const FREE_COUNT = 12;
    const total = readySongs.length;
    const ids = new Set();
    if (total <= FREE_COUNT) {
      readySongs.forEach(s => ids.add(s.id));
    } else {
      const dayOffset = new Date().getDay();
      for (let i = 0; i < FREE_COUNT; i++) {
        ids.add(readySongs[(dayOffset * 2 + i) % total].id);
      }
    }
    return ids;
  }, [readySongs]);

  const filtered = readySongs.filter(s => {
    const matchSearch = !search ||
      s.title?.toLowerCase().includes(search.toLowerCase()) ||
      s.artist?.toLowerCase().includes(search.toLowerCase());
    const matchGenre = genre === 'All' || s.genre === GENRE_TO_VALUE[genre];
    const matchLevel = level === 'All' || s.cefr_level === level;
    return matchSearch && matchGenre && matchLevel;
  });

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Song Catalog — Learn Spanish with Music | Spanish Beats"
        description="Browse the full Spanish Beats song catalog — reggaeton, bachata, pop latino. Tap-to-translate lyrics, karaoke, and CEFR-leveled lessons."
      />
      <div className="px-5 pt-14 pb-4">
        <h1 className="text-2xl font-bold mb-1">Song Catalog</h1>
        <p className="text-sm text-muted-foreground">Browse songs and start learning</p>
      </div>

      {/* Search */}
      <div className="px-5 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search songs or artists…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-muted/50 border-0 focus-visible:ring-primary/30"
          />
        </div>
      </div>

      {/* Genre filters */}
      <div className="px-5 pb-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {GENRES.map(g => (
            <button
              key={g}
              onClick={() => setGenre(g)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${genre === g
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Level filters */}
      <div className="px-5 pb-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {LEVELS.map(l => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${level === l
                  ? 'bg-foreground text-background shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                }`}
            >
              {l === 'All' ? 'All Levels' : l}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="px-5 pb-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3 p-3">
                <div className="w-14 h-14 rounded-lg bg-muted animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-3.5 w-28 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card rounded-2xl border border-border/50 divide-y divide-border/50"
          >
            {filtered.map(song => (
              <SongCard key={song.id} song={song} locked={!isPro && !freeIds.has(song.id)} />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-16 space-y-3">
            <div className="h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto">
              <Music className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-semibold">No songs found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}