import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Loader2, RefreshCw, Music2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SlangOfTheDay from '@/components/song/SlangOfTheDay';
import DailyWordCard from '@/components/song/DailyWordCard';
import AddSongSection from '@/components/song/AddSongSection';
import SongGridCard from '@/components/song/SongGridCard';
import PullToRefresh from '@/components/PullToRefresh';
import LanguageHeader from '@/components/LanguageHeader';
import MilestoneCelebration from '@/components/achievements/MilestoneCelebration';
import DeferredSection from '@/components/DeferredSection';
import { useLanguage } from '@/lib/LanguageContext';
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

  const langCtx = useLanguage();
  const langStr = langCtx.lang;
  const langFlag = langCtx.flag;

  const filtered = useMemo(() => {
    const lc = (langStr || 'Spanish').toLowerCase();
    return deduped.filter((s) => (s.language || 'Spanish').toLowerCase() === lc);
  }, [deduped, langStr]);

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

  // Stable bank of 18 songs at the user's level — seeded once, never updated with recent searches
  const seeded = useRef(null);
  const recommended = useMemo(() => {
    if (seeded.current) return seeded.current;
    if (filtered.length === 0) return []; // songs not loaded yet → stay empty until first render after load
    const atLevel = filtered.filter((s) => songCefr(s.difficulty) === USER_LEVEL);
    const shuffled = [...atLevel].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, 18); // seed from 18

    seeded.current = picked;
    return picked;
  }, [filtered]);

  const challenges = useMemo(() => {
    const aboveLevel = filtered.filter((s) => LEVEL_ORDER.indexOf(songCefr(s.difficulty)) > LEVEL_ORDER.indexOf(USER_LEVEL));
    return aboveLevel.slice(0, 3);
  }, [filtered]);

  const history = useMemo(() => {
    return [...filtered].sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date)).slice(0, 3);
  }, [filtered]);

  return (
    <PullToRefresh onRefresh={loadSongs}>
    <div className="max-w-5xl mx-auto px-4 pb-24">
      <LanguageHeader />
      <DeferredSection><MilestoneCelebration /></DeferredSection>
      {/* Header */}
      <div className="mb-6 px-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground pt-4">
          <span className="text-primary">Ritmo</span> — <span className="capitalize">{langStr}</span> Song Teacher
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Pick a {langStr} song, sing along, and pick up {langStr}.</p>
      </div>

      {/* Word of the Day */}
      <DeferredSection delay={200}>
      <div className="mb-6 px-4">
        <DailyWordCard />
      </div>
      </DeferredSection>

      {/* Slang of the Day */}
      <DeferredSection delay={300}>
      <div className="mb-6 px-4">
        <SlangOfTheDay />
      </div>
      </DeferredSection>

      {/* Add a New Song */}
      <div className="mb-8 px-4">
        <AddSongSection />
      </div>

      {/* Recommended For Your Level */}
      <div className="mb-8 px-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-foreground">🔥 Recommended For Your {langFlag} {langStr || 'Level'} 🔥</h2>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="Refresh for a new mix"
          >
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          6 songs picked for you · tuned for <span className="font-semibold">{USER_LEVEL}</span> · refreshed manually for a new mix.
        </p>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : recommended.length === 0 ? (
          <EmptyState langStr={langStr} langFlag={langFlag} />
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
    </PullToRefresh>
  );
}

function EmptyState({ langStr = '', langFlag = '' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Music2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
      <p className="text-sm text-muted-foreground">
        No {langStr} songs have been generated yet. Be the first to add one below! <span className="inline-block">↓</span>
      </p>
    </div>
  );
}