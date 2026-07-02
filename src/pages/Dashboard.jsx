import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Loader2, RefreshCw, Music2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SlangOfTheDay from '@/components/song/SlangOfTheDay';
import DailyWordCard from '@/components/song/DailyWordCard';
import AddSongSection from '@/components/song/AddSongSection';
import SongGridCard from '@/components/song/SongGridCard';
import SearchHistorySection from '@/components/dashboard/SearchHistorySection';
import PullToRefresh from '@/components/PullToRefresh';
import MilestoneCelebration from '@/components/achievements/MilestoneCelebration';
import { songCefrLevel } from '@/lib/cefr';
import { getProgress } from '@/lib/progress';
import { getCurriculumTracks, getSongCompletions, LEVEL_ORDER } from '@/lib/curriculum';
import CurriculumProgressWidget from '@/components/curriculum/CurriculumProgressWidget';

export default function Dashboard() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [userLevel, setUserLevel] = useState('A1');
  const [completedSongIds, setCompletedSongIds] = useState([]);

  const loadSongs = async () => {
    const list = await base44.entities.Song.list('-created_date', 100);
    setSongs(list);
    try {
      const [p, comps] = await Promise.all([getProgress(), getSongCompletions()]);
      const level = p?.cefr_level || 'A1';
      setUserLevel(level);
      setCompletedSongIds(comps.map((c) => c.song_id));
    } catch { /* noop */ }
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

  // Recommended songs: pull from the user's curriculum track first (next incomplete highlighted),
  // then fall back to any songs at the user's CEFR level.
  const recommended = useMemo(() => {
    if (deduped.length === 0) return [];
    const atLevel = deduped.filter((s) => songCefrLevel(s) === userLevel);
    // Put incomplete songs first, then completed ones at the end
    const incomplete = atLevel.filter((s) => !completedSongIds.includes(s.id));
    return [...incomplete, ...atLevel.filter((s) => completedSongIds.includes(s.id))].slice(0, 6);
  }, [deduped, userLevel, completedSongIds, refreshKey]);

  const challenges = useMemo(() => {
    const aboveLevel = deduped.filter((s) => LEVEL_ORDER.indexOf(songCefrLevel(s)) > LEVEL_ORDER.indexOf(userLevel));
    return aboveLevel.slice(0, 3);
  }, [deduped, userLevel]);

  return (
    <PullToRefresh onRefresh={loadSongs}>
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-24">
      <MilestoneCelebration />
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
          <span className="text-primary">Ritmo</span> - the spanish song teacher
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Pick a song, Sing along & Pick up Spanish.</p>
      </div>

      {/* Word of the Day */}
      <div className="mb-6">
        <DailyWordCard />
      </div>

      {/* Slang of the Day */}
      <div className="mb-6">
        <SlangOfTheDay />
      </div>

      {/* Add a New Song */}
      <div className="mb-8">
        <AddSongSection />
      </div>

      {/* Curriculum progress widget */}
      <CurriculumProgressWidget cefrLevel={userLevel} songsCompleted={completedSongIds.length} />

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
          6 songs picked for you · tuned for <span className="font-semibold">{userLevel}</span> · refreshed manually for a new mix.
        </p>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : recommended.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {recommended.slice(0, 6).map((song) => (
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
            stretch picks above {userLevel} — fully unlocked, dive in whenever you're feeling brave.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {challenges.map((song) => (
              <SongGridCard key={song.id} song={song} levelUp />
            ))}
          </div>
        </div>
      )}

      {/* Your Search History */}
      <SearchHistorySection />
    </div>
    </PullToRefresh>
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