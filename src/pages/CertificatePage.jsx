import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Loader2, Music2, Award } from 'lucide-react';
import { useLevelProgressFor } from '@/data/hooks/useCurriculum';
import { songsRepo } from '@/data/repositories/songs.repo';
import { levelMeta } from '@/lib/curriculum';

export default function CertificatePage() {
  const { level } = useParams();
  const { data: lpList, isLoading: lpLoading } = useLevelProgressFor(level);
  const lp = lpList?.[0] || null;
  const songIds = lp?.songs_completed?.slice(0, 8) || [];

  const { data: songs = [], isLoading: songsLoading } = useQuery({
    queryKey: ['certificatePage', 'songs', level, songIds],
    queryFn: () => Promise.all(songIds.map((id) => songsRepo.get(id).catch(() => null))).then((r) => r.filter(Boolean)),
    enabled: songIds.length > 0,
  });

  const loading = lpLoading || (songIds.length > 0 && songsLoading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const meta = levelMeta(level);
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-background flex flex-col items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Certificate card */}
        <div className="rounded-2xl border-2 border-amber-400 bg-white shadow-xl p-8">
          <div className="text-center mb-4">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mx-auto mb-3">
              <Music2 className="h-7 w-7 text-white" />
            </div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Spanish Beats</p>
            <h1 className="text-xl font-bold text-foreground mt-1">Certificate of Completion</h1>
          </div>
          <p className="text-sm text-muted-foreground text-center">This certifies that a dedicated learner</p>
          <p className="text-lg font-bold text-center text-foreground my-1">has completed the {meta.name} track</p>
          <p className="text-sm text-center text-foreground mt-1">CEFR Level {level} · {date}</p>
          {songs.length > 0 && (
            <div className="mt-4 border-t border-amber-200 pt-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Songs completed:</p>
              <ul className="text-xs text-foreground space-y-0.5">
                {songs.map((s, i) => (
                  <li key={i}>{i + 1}. {s.title} — {s.artist}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-4 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-amber-400 flex items-center justify-center text-white shadow-lg">
              <Award className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            Learn Spanish with music at SpanishBeats.com →
          </Link>
        </div>
      </div>
    </div>
  );
}