import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, RefreshCw, Music2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { songsRepo } from '@/data/repositories/songs.repo';
import { useSongsList } from '@/data/hooks/useSongs';
import { useUserProgress, useUpdateUserProgress } from '@/data/hooks/useUserProgress';
import { useCurriculumTracks } from '@/data/hooks/useCurriculum';
import { useSongCompletionsList } from '@/data/hooks/useSongCompletions';
import SlangOfTheDay from '@/components/song/SlangOfTheDay';
import DailyWordCard from '@/components/song/DailyWordCard';
import AddSongSection from '@/components/song/AddSongSection';
import SongGridCard from '@/components/song/SongGridCard';
import SearchHistorySection from '@/components/dashboard/SearchHistorySection';
import PullToRefresh from '@/components/PullToRefresh';
import MilestoneCelebration from '@/components/achievements/MilestoneCelebration';
import { songCefrLevel } from '@/lib/cefr';
import { LEVEL_ORDER } from '@/lib/curriculum';
import CurriculumProgressWidget from '@/components/curriculum/CurriculumProgressWidget';
import CurriculumHealthBanner from '@/components/dashboard/CurriculumHealthBanner';
import { isSongReady } from '@/lib/genres';
import GenreStatsWidget from '@/components/dashboard/GenreStatsWidget';
import WordsTappedWidget from '@/components/dashboard/WordsTappedWidget';
import GenrePicker from '@/components/dashboard/GenrePicker';
import SEOHead from '@/components/SEOHead';

export default function Dashboard() {
  const { data: allSongs = [], isLoading: songsLoading, refetch: refetchSongs } = useSongsList('-created_date', 100);
  const { data: progress, isLoading: progressLoading, refetch: refetchProgress } = useUserProgress();
  const { data: tracks = [], isLoading: tracksLoading, refetch: refetchTracks } = useCurriculumTracks();
  const { data: completions = [], isLoading: completionsLoading, refetch: refetchCompletions } = useSongCompletionsList();
  const updateUserProgress = useUpdateUserProgress();

  const songs = useMemo(() => allSongs.filter(isSongReady), [allSongs]);
  const userLevel = progress?.cefr_level || 'A1';
  const completedSongIds = useMemo(() => completions.map((c) => c.song_id), [completions]);
  const favGenres = Array.isArray(progress?.fav_genres) ? progress.fav_genres : [];

  // Recommended For Your Level — from curriculum track, or a CEFR-level fallback
  const userTrack = useMemo(() => tracks.find((t) => t.cefr_level === userLevel), [tracks, userLevel]);
  const recommendedQuery = useQuery({
    queryKey: ['dashboard', 'recommended', userLevel, userTrack?.id],
    queryFn: async () => {
      if (userTrack?.song_ids?.length) {
        const trackSongs = await songsRepo.filter({ id: { $in: userTrack.song_ids } });
        return trackSongs.filter((s) => ['ready', 'ready_synced', 'ready_unsynced', 'static', 'pending'].includes(s.sync_status));
      }
      const fallback = await songsRepo.filter({ cefr_level: userLevel, is_catalog_default: true });
      return fallback.slice(0, 12);
    },
    enabled: !progressLoading && !tracksLoading,
  });
  const recommendedSongs = recommendedQuery.data || [];

  // Explore Next Challenges — next CEFR level
  const nextLevel = LEVEL_ORDER[LEVEL_ORDER.indexOf(userLevel) + 1];
  const challengeQuery = useQuery({
    queryKey: ['dashboard', 'challenge', nextLevel],
    queryFn: () => songsRepo.filter({ cefr_level: nextLevel, is_catalog_default: true }).then((r) => r.slice(0, 6)),
    enabled: !!nextLevel && !progressLoading,
  });
  const challengeSongs = challengeQuery.data || [];

  const loading = songsLoading || progressLoading || tracksLoading || completionsLoading;

  const loadSongs = async () => {
    await Promise.all([
      refetchSongs(), refetchProgress(), refetchTracks(), refetchCompletions(),
      recommendedQuery.refetch(), challengeQuery.refetch(),
    ]);
  };

  const handleToggleGenre = async (genre) => {
    if (!progress?.id) return;
    const newGenres = favGenres.includes(genre)
      ? favGenres.filter((g) => g !== genre)
      : [...favGenres, genre];
    try {
      await updateUserProgress.mutateAsync({ id: progress.id, patch: { fav_genres: newGenres } });
    } catch { /* noop */ }
  };

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
      <CurriculumHealthBanner tracks={tracks} songs={allSongs} />
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
      <div className="mb-4">
        <SlangOfTheDay favGenres={favGenres} />
      </div>

      {/* Continue where you left off */}
      <CurriculumProgressWidget cefrLevel={userLevel} songsCompleted={completedSongIds.length} />

      {/* This week's goal */}
      <GenreStatsWidget favGenres={favGenres} onToggleGenre={handleToggleGenre} />

      {/* Words tapped this week */}
      <WordsTappedWidget />

      {/* Add a New Song */}
      <div className="mb-4">
        <AddSongSection />
      </div>

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