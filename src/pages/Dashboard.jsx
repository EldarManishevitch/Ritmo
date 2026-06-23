import React, { useEffect, useState } from 'react';
import { Plus, Loader2, Music2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SongCard from '@/components/song/SongCard';
import DailyPhraseCard from '@/components/song/DailyPhraseCard';
import AddSongDialog from '@/components/song/AddSongDialog';

const GENRES = ['reggaeton', 'bachata', 'pop latino', 'trap latino', 'merengue', 'salsa', 'rock latino'];
const DIFFICULTIES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function Dashboard() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [genre, setGenre] = useState('all');
  const [difficulty, setDifficulty] = useState('all');

  const loadSongs = async () => {
    const list = await base44.entities.Song.list('-created_date', 100);
    setSongs(list);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadSongs()
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = songs.filter((s) =>
    (genre === 'all' || s.genre === genre) &&
    (difficulty === 'all' || s.difficulty === difficulty)
  );

  const featured = songs.find((s) => s.is_featured) || songs[0];

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Learn</h1>
          <p className="text-sm text-muted-foreground">Pick a song and start listening</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add song
        </Button>
      </div>

      {/* Daily phrase */}
      <div className="mb-6">
        <DailyPhraseCard />
      </div>

      {/* Featured */}
      {featured && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Featured</h2>
          <SongCard song={featured} featured />
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">All songs</h2>
        <span className="text-xs text-muted-foreground">{filtered.length}</span>
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 pb-1">
        <FilterChip label="All" active={genre === 'all'} onClick={() => setGenre('all')} />
        {GENRES.map((g) => (
          <FilterChip key={g} label={g} active={genre === g} onClick={() => setGenre(g)} />
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
        <FilterChip label="Any level" active={difficulty === 'all'} onClick={() => setDifficulty('all')} />
        {DIFFICULTIES.map((d) => (
          <FilterChip key={d} label={d} active={difficulty === d} onClick={() => setDifficulty(d)} />
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Music2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground mb-1">No songs yet</p>
          <p className="text-xs text-muted-foreground/60 mb-4">Add your first song to start learning</p>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add a song
          </Button>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      )}

      <AddSongDialog open={addOpen} onClose={() => setAddOpen(false)} onAdded={() => loadSongs()} />
    </div>
  );
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
        active ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70'
      }`}
    >
      {label}
    </button>
  );
}