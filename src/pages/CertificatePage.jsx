import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, Music2, Award } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { levelMeta } from '@/lib/curriculum';

export default function CertificatePage() {
  const { level } = useParams();
  const [loading, setLoading] = useState(true);
  const [lp, setLp] = useState(null);
  const [songs, setSongs] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const lps = await base44.entities.LevelProgress.filter({ cefr_level: level });
        const found = lps?.[0];
        if (cancelled) return;
        setLp(found);
        if (found?.songs_completed?.length) {
          const loaded = await Promise.all(
            found.songs_completed.slice(0, 8).map((id) => base44.entities.Song.get(id).catch(() => null))
          );
          if (!cancelled) setSongs(loaded.filter(Boolean));
        }
      } catch { /* noop */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [level]);

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