import React, { useEffect, useState, useMemo } from 'react';
import { Loader2, RefreshCw, Music2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SlangOfTheDay from '@/components/song/SlangOfTheDay';
import AddSongSection from '@/components/song/AddSongSection';
import SongGridCard from '@/components/song/SongGridCard';
import { songCefr } from '@/lib/cefr';

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2'];
const USER_LEVEL = 'A1';

export default function Dashboard() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

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

  // Deduplicate by youtube_id (or title+artist fallback) so the same track never appears twice
  const deduped = useMemo(() => {
    const seen = new Set();
    return songs.filter((s) => {
      const key = s.youtube_id || `${s.title?.toLowerCase()}|${s.artist?.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [songs]);

  const recommended = useMemo(() => {
    const atLevel = deduped.filter((s) => songCefr(s.difficulty) === USER_LEVEL);
    const shuffled = [...atLevel].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 6);
  }, [deduped, refreshKey]);

  const challenges = useMemo(() => {
    const aboveLevel = deduped.filter((s) => LEVEL_ORDER.indexOf(songCefr(s.difficulty)) > LEVEL_ORDER.indexOf(USER_LEVEL));
    return aboveLevel.slice(0, 3);
  }, [deduped]);

  const history = useMemo(() => {
    return [...deduped].sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date)).slice(0, 3);
  }, [deduped]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Ritmo - the spanish song teacher</h1>
        <p className="text-sm text-muted-foreground mt-1">Pick a song, Sing along & Pick up Spanish.</p>
      </div>

      {/* Slang of the Day */}
      <div className="mb-6">
        <SlangOfTheDay />
      </div>

      {/* Add a New Song */}
      <div className="mb-8">
        <AddSongSection />
      </div>

      {/* Recommended For Your Level */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-foreground">🔥 Recommended For Your Level 🔥</h2>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="Refresh for a new mix"
          >
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {recommended.length} songs picked for you · tuned for <span className="font-semibold">{USER_LEVEL}</span> · refresh for a new mix.
        </p>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : recommended.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {recommended.map((song) => (
              <SongGridCard key={song.id} song={song} />
            ))}
          </div>
        )}
      </div>

      {/* Explore Next Challenges */}
      {challenges.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-1">Explore Next Challenges 🚀</h2>
          <p className="text-sm text-muted-foreground mb-4">
            stretch picks above {USER_LEVEL} — fully unlocked, dive in whenever you're feeling brave.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {challenges.map((song) => (
              <SongGridCard key={song.id} song={song} levelUp />
            ))}
          </div>
        </div>
      )}

      {/* Your Search History */}
      {history.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-1">🎧 Your Search History</h2>
          <p className="text-sm text-muted-foreground mb-4">
            the last {history.length} songs you opened — jump right back in.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {history.map((song) => (
              <SongGridCard key={song.id} song={song} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Music2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
      <p className="text-sm text-muted-foreground">No songs yet. Add one above to get started!</p>
    </div>
  );
}