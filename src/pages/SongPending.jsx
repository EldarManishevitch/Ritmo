import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Music, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STAGES = [
  { pct: 4, label: 'Searching YouTube…' },
  { pct: 10, label: 'Fetching lyrics from providers…' },
  { pct: 31, label: 'AI generating translation & phonetics…' },
  { pct: 75, label: 'Syncing timestamps to video…' },
  { pct: 99, label: 'Saving to database…' },
];

export default function SongPending() {
  const { youtubeId } = useParams();
  const navigate = useNavigate();
  const [pct, setPct] = useState(0);
  const [stageIdx, setStageIdx] = useState(0);
  const timerRef = useRef(null);

  // Animate the progress bar through the stages
  useEffect(() => {
    let cur = 0;
    const interval = setInterval(() => {
      const target = STAGES[stageIdx].pct;
      if (cur < target) {
        cur = Math.min(target, cur + 1);
        setPct(cur);
      }
    }, 80);
    return () => clearInterval(interval);
  }, [stageIdx]);

  // Advance through stages
  useEffect(() => {
    const stageTimer = setInterval(() => {
      setStageIdx((prev) => Math.min(prev + 1, STAGES.length - 1));
    }, 3000);
    return () => clearInterval(stageTimer);
  }, []);

  // Poll for song completion — check if a Song with this youtube_id is ready
  useEffect(() => {
    if (!youtubeId) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const songs = await base44.entities.Song.filter({ youtube_id: youtubeId }, '-created_date', 1);
        if (cancelled) return;
        const song = songs && songs[0];
        if (song && ['ready', 'ready_synced', 'ready_unsynced', 'static'].includes(song.sync_status)) {
          navigate(`/song/${song.id}`, { replace: true });
          return;
        }
      } catch { /* keep polling */ }
      timerRef.current = setTimeout(poll, 2500);
    };

    poll();
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [youtubeId, navigate]);

  const currentStage = STAGES[stageIdx];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="h-16 w-16 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto mb-6">
          <Music className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Generating your song…</h1>
        <p className="text-sm text-muted-foreground mb-8">
          We're fetching lyrics, translating, and syncing timestamps. This usually takes 10–30 seconds.
        </p>

        {/* Progress bar */}
        <div className="w-full h-3 rounded-full bg-muted overflow-hidden mb-3">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{currentStage.label}</span>
          <span className="font-semibold text-foreground">{pct}%</span>
        </div>
      </div>
    </div>
  );
}