import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ArrowRight, GraduationCap } from 'lucide-react';
import { songsRepo } from '@/data/repositories/songs.repo';
import { getProgress, levelForXp } from '@/lib/progress';
import {
  getCurriculumTracks, getAllLevelProgress, getSongCompletions,
  levelMeta, LEVEL_ORDER, getNextSongInTrack,
} from '@/lib/curriculum';
import LevelCard from '@/components/curriculum/LevelCard';
import { isSongReady } from '@/lib/genres';
import SEOHead from '@/components/SEOHead';

export default function Curriculum() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [levelProgresses, setLevelProgresses] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [songs, setSongs] = useState({});
  const [nextSong, setNextSong] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [p, tr, lp, comps] = await Promise.all([
          getProgress(),
          getCurriculumTracks(),
          getAllLevelProgress(),
          getSongCompletions(),
        ]);
        if (cancelled) return;
        setProgress(p);
        setTracks(tr);
        setLevelProgresses(lp);
        setCompletions(comps);

        // Resolve songs per track (single query per track, cached in state)
        const songsMap = {};
        await Promise.all(tr.map(async (track) => {
          const ids = track.song_ids || [];
          if (!ids.length) return;
          try {
            const trackSongs = (await songsRepo.filter({ id: { $in: ids } })).filter(isSongReady);
            const byId = {};
            trackSongs.forEach((s) => { byId[s.id] = s; });
            songsMap[track.id] = ids.map((id) => byId[id]).filter(Boolean);
          } catch { /* noop */ }
        }));
        if (!cancelled) setSongs(songsMap);

        const userLevel = p?.cefr_level || levelForXp(p?.xp || 0).cefr;
        const completedIds = comps.map((c) => c.song_id);
        const next = await getNextSongInTrack(userLevel, completedIds);
        if (!cancelled) setNextSong(next);
      } catch { /* noop */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const userCefr = progress?.cefr_level || levelForXp(progress?.xp || 0).cefr;
  const userLevelIndex = LEVEL_ORDER.indexOf(userCefr);
  const completedSongIds = useMemo(() => completions.map((c) => c.song_id), [completions]);

  const nextLevelXp = (() => {
    const next = LEVEL_ORDER[userLevelIndex + 1];
    if (!next) return null;
    const levelDef = levelForXp(0);
    return null; // XP bar handled by levelForXp thresholds
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-24">
      <SEOHead
        title="Spanish CEFR curriculum A1 to C1 — learn through music | Spanish Beats"
        description="A structured Spanish learning path from absolute beginner (A1) to advanced (C1) — using real reggaeton, bachata, and pop latino songs. Earn certificates at every level."
      />
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Your Spanish journey</h1>
        <p className="text-sm text-muted-foreground mt-1">Complete songs, earn certificates, advance your level.</p>
      </div>

      {/* Current level banner */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white p-5 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">Current Level</span>
            </div>
            <h2 className="text-xl font-bold">{userCefr} · {levelMeta(userCefr).name}</h2>
            <p className="text-sm text-white/80">{progress?.xp || 0} XP</p>
          </div>
          {nextSong && (
            <Link to={`/song/${nextSong.id}`} className="flex items-center gap-1 text-sm font-semibold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full transition-colors whitespace-nowrap">
              Continue <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Level cards */}
      <div className="space-y-4">
        {tracks.map((track) => {
          const isLocked = LEVEL_ORDER.indexOf(track.cefr_level) > userLevelIndex;
          const lp = levelProgresses.find((l) => l.cefr_level === track.cefr_level);
          return (
            <LevelCard
              key={track.id}
              track={track}
              levelProgress={lp}
              songs={songs[track.id] || []}
              isLocked={isLocked}
              userCefrLevel={userCefr}
            />
          );
        })}
      </div>
    </div>
  );
}