import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ArrowRight, GraduationCap, ChevronDown, ChevronUp } from 'lucide-react';
import { songsRepo } from '@/data/repositories/songs.repo';
import { getProgress, levelForXp } from '@/lib/progress';
import {
  getCurriculumTracks, getAllLevelProgress, getSongCompletions,
  levelMeta, LEVEL_ORDER, getNextSongInTrack,
} from '@/lib/curriculum';
import LevelCard from '@/components/curriculum/LevelCard';
import { isSongReady } from '@/lib/genres';
import SEOHead from '@/components/SEOHead';

const SONG_ROUTINE = [
  { step: 'Cold listen', desc: 'Melody only, no lyrics. What’s the mood? What words jump out?' },
  { step: 'Gap listen', desc: 'Lyrics with 6–10 words blanked; fill from listening.' },
  { step: 'Grammar mining', desc: 'Pull the target structure from the lyrics; study it explicitly.' },
  { step: 'Shadowing', desc: 'Sing along to train mouth, rhythm, and connected speech.' },
  { step: 'Production', desc: 'Reuse the structure to say something true about yourself.' },
];

const WEEKLY_RHYTHM = [
  { label: 'Grammar + structured practice', pct: 50 },
  { label: 'Songs (the routine above)', pct: 20 },
  { label: 'Reading', pct: 15 },
  { label: 'Speaking + writing', pct: 15 },
];

function CurriculumMethodology() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl bg-card border border-border p-5 mb-6">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center justify-between w-full text-left">
        <div>
          <h2 className="font-bold text-foreground">How this curriculum works</h2>
          <p className="text-xs text-muted-foreground mt-0.5">The 5-step song routine, and how to split your study time</p>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
      </button>
      {open && (
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">The 5-step song routine (per anchor song)</p>
            <ol className="space-y-1.5 text-sm">
              {SONG_ROUTINE.map((s, i) => (
                <li key={s.step} className="flex gap-2">
                  <span className="font-semibold text-primary flex-shrink-0">{i + 1}.</span>
                  <span><span className="font-medium text-foreground">{s.step}</span> <span className="text-muted-foreground">— {s.desc}</span></span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Weekly rhythm (≈ 6–8 hrs/week for steady progress)</p>
            <div className="space-y-2">
              {WEEKLY_RHYTHM.map((r) => (
                <div key={r.label}>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-semibold text-foreground">{r.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${r.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
        title="Spanish CEFR curriculum A1 to C2 — learn through music | Spanish Beats"
        description="A structured Spanish learning path from absolute beginner (A1) to near-native mastery (C2) — anchored by real songs, with a grammar syllabus mined from the lyrics at every level. Earn certificates at every level."
      />
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Your Spanish journey</h1>
        <p className="text-sm text-muted-foreground mt-1">Complete songs, earn certificates, advance your level.</p>
      </div>

      <CurriculumMethodology />

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