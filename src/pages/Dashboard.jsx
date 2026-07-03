import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Loader2, RefreshCw, Music2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
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
import { isSongReady } from '@/lib/genres';
import GenreStatsWidget from '@/components/dashboard/GenreStatsWidget';
import GenrePicker from '@/components/dashboard/GenrePicker';
import SEOHead from '@/components/SEOHead';

export default function Dashboard() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLevel, setUserLevel] = useState('A1');
  const [completedSongIds, setCompletedSongIds] = useState([]);
  const [favGenres, setFavGenres] = useState([]);
  const [recommendedSongs, setRecommendedSongs] = useState([]);
  const [challengeSongs, setChallengeSongs] = useState([]);

  const loadSongs = async () => {
    const list = await base44.entities.Song.list('-created_date', 100);
    setSongs(list.filter(isSongReady));
    try {
      const [p, comps, tracks] = await Promise.all([getProgress(), getSongCompletions(), getCurriculumTracks()]);
      const level = p?.cefr_level || 'A1';
      setUserLevel(level);
      setCompletedSongIds(comps.map((c) => c.song_id));
      setFavGenres(Array.isArray(p?.fav_genres) ? p.fav_genres : []);

      // Recommended For Your Level — from curriculum track
      const userTrack = tracks.find((t) => t.cefr_level === level);
      let recs = [];
      if (userTrack?.song_ids?.length) {
        const trackSongs = await base44.entities.Song.filter({ id: { $in: userTrack.song_ids } });
        recs = trackSongs.filter((s) => ['ready', 'ready_synced', 'ready_unsynced', 'static', 'pending'].includes(s.sync_status));
      } else {
        const fallback = await base44.entities.Song.filter({ cefr_level: level, is_catalog_default: true });
        recs = fallback.slice(0, 12);
      }
      setRecommendedSongs(recs);

      // Explore Next Challenges — next CEFR level
      const nextLevel = LEVEL_ORDER[LEVEL_ORDER.indexOf(level) + 1];
      let challenges = [];
      if (nextLevel) {
        const nextSongs = await base44.entities.Song.filter({ cefr_level: nextLevel, is_catalog_default: true });
        challenges = nextSongs.slice(0, 6);
      }
      setChallengeSongs(challenges);
    } catch { /* noop */ }
  };

  const handleToggleGenre = async (genre) => {
    const newGenres = favGenres.includes(genre)
      ? favGenres.filter((g) => g !== genre)
      : [...favGenres, genre];
    setFavGenres(newGenres);
    try {
      const p = await getProgress();
      await base44.entities.UserProgress.update(p.id, { fav_genres: newGenres });
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

  const exploreGenres = useMemo(() => {
    if (deduped.length === 0 || favGenres.length === 0) return [];
    const favSet = new Set(favGenres);
    return deduped.filter((s) => songCefrLevel(s) === userLevel && !favSet.has(s.genre)).slice(0, 4);
  }, [deduped, userLevel, favGenres]);

  return (
    <PullToRefresh onRefresh={loadSongs}>
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-24">
      <SEOHead
        title="Learn Spanish by singing Bad Bunny, Aventura & Karol G | Spanish Beats"
        description="Learn Spanish through real music — Bad Bunny, Aventura, Shakira, and more. Tap any word for an instant translation. Karaoke lyrics synced to YouTube. AI voice coach. Start free."
      />
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
        <SlangOfTheDay favGenres={favGenres} />
      </div>

      {/* Add a New Song */}
      <div className="mb-8">
        <AddSongSection />
      </div>

      {/* Curriculum progress widget */}
      <CurriculumProgressWidget cefrLevel={userLevel} songsCompleted={completedSongIds.length} />

      <GenreStatsWidget favGenres={favGenres} onToggleGenre={handleToggleGenre} />

      {/* Recommended For Your Level */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-foreground">🔥 Recommended For Your Level 🔥</h2>
          <button
            onClick={() => loadSongs()}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Songs from your <span className="font-semibold">{userLevel}</span> curriculum track.
        </p>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : recommendedSongs.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 sm:hidden">
              {recommendedSongs.slice(0, 6).map((song) => (
                <div key={song.id} className="min-w-[160px] flex-shrink-0">
                  <SongGridCard song={song} />
                </div>
              ))}
            </div>
            <div className="hidden sm:grid grid-cols-3 gap-4">
              {recommendedSongs.slice(0, 6).map((song) => (
                <SongGridCard key={song.id} song={song} />
              ))}
            </div>
            <Link to="/curriculum" className="inline-flex items-center gap-1 text-sm font-semibold text-primary mt-4 hover:underline">
              View full curriculum <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        )}
      </div>

      {/* Explore other genres */}
      {favGenres.length === 0 ? (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-2">🎵 Pick your music taste</h2>
          <p className="text-sm text-muted-foreground mb-4">Choose genres you love — we'll prioritize them in your recommendations.</p>
          <GenrePicker selected={favGenres} onToggle={handleToggleGenre} />
        </div>
      ) : exploreGenres.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-1">Explore other genres 🌎</h2>
          <p className="text-sm text-muted-foreground mb-4">Songs outside your usual picks — discover something new.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {exploreGenres.map((song) => (
              <SongGridCard key={song.id} song={song} />
            ))}
          </div>
        </div>
      )}

      {/* Explore Next Challenges */}
      {challengeSongs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-1">Explore Next Challenges 🚀</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Stretch picks above {userLevel} — fully unlocked, dive in whenever you're feeling brave.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {challengeSongs.map((song) => (
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