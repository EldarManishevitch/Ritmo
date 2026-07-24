import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Play, Volume2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import CollapsibleCard from '@/components/song/CollapsibleCard';
import { artistToGenre, genreColor, genreLabel } from '@/lib/genres';

export default function SlangOfTheDay({ favGenres = [] }) {
  const navigate = useNavigate();
  const [slang, setSlang] = useState(null);
  const [loading, setLoading] = useState(true);
  const [song, setSong] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await base44.entities.SlangDictionary.filter({ is_urban_slang: true }, '-created_date', 50);
        if (cancelled) return;
        if (!rows || !rows.length) { setLoading(false); return; }
        // Prefer slang from user's favorite genres using artist→genre map
        const favSet = new Set(favGenres);
        const genreMatched = rows.filter((r) => {
          const g = artistToGenre(r.example_song_artist);
          return g && favSet.has(g);
        });
        const pool = favSet.size > 0 && genreMatched.length > 0 ? genreMatched : rows;
        const pick = pool[Math.floor(Math.random() * pool.length)];
        setSlang(pick);

        // Try to match the example song to an existing Song record for the play button
        if (pick.example_song_title) {
          const songs = await base44.entities.Song.filter({}, '-created_date', 200);
          const match = songs.find((s) =>
            (s.title || '').toLowerCase().includes(pick.example_song_title.toLowerCase())
          );
          if (match && !cancelled) setSong(match);
        }
      } catch { /* noop */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const speak = () => {
    if (!slang) return;
    const u = new SpeechSynthesisUtterance(slang.term);
    u.lang = 'es-MX';
    u.rate = 0.85;
    speechSynthesis.speak(u);
  };

  if (loading) {
    return <div className="rounded-2xl bg-card border border-border p-5 animate-pulse h-56" />;
  }
  if (!slang) return null;

  return (
    <CollapsibleCard
      header={
        <div className="flex items-center gap-2">
          <span className="inline-block text-xs font-semibold text-white bg-[#2d3e4e] px-2.5 py-1 rounded-md">
            Slang of the Day
          </span>
          <span className="text-base font-bold text-foreground">{slang.term}</span>
        </div>
      }
    >
      <div className="px-5 pb-4">
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-2xl font-bold text-foreground">{slang.term}</h3>
          {slang.example_song_artist && (() => {
            const g = artistToGenre(slang.example_song_artist);
            return g ? (
              <span className={`text-xs px-2 py-0.5 rounded-full ${genreColor(g).solid} text-white`}>
                {genreLabel(g)}
              </span>
            ) : null;
          })()}
          <button
            onClick={speak}
            className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center hover:bg-primary/25 transition-colors active:scale-95"
            title="Listen to pronunciation"
          >
            <Volume2 className="h-4 w-4 text-primary" />
          </button>
        </div>

        <div className="space-y-2.5 mb-4">
          {/* Dual box: literal + english equivalent */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-muted/50 border border-border p-3">
              <span className="text-[10px] font-semibold text-muted-foreground/60 tracking-wide block mb-1">LITERAL</span>
              <p className="text-sm text-foreground">{slang.literal_meaning}</p>
            </div>
            <div className="rounded-xl bg-muted/50 border border-border p-3">
              <span className="text-[10px] font-semibold text-muted-foreground/60 tracking-wide block mb-1">ENGLISH EQUIVALENT</span>
              <p className="text-sm text-foreground">{slang.english_equivalent}</p>
            </div>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground/60 tracking-wide">MEANING</span>
            <p className="text-sm text-foreground">{slang.contextual_meaning}</p>
          </div>
          {slang.example_usage && (
            <div>
              <span className="text-[10px] font-semibold text-muted-foreground/60 tracking-wide">EXAMPLE</span>
              <p className="text-sm italic text-foreground">"{slang.example_usage}"</p>
            </div>
          )}
        </div>

        {(slang.lyrics_snippet || slang.example_song_title) && (
          <>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <Music className="h-3.5 w-3.5" />
              <span className="font-medium">AS HEARD IN</span>
              <span className="text-foreground flex-1 min-w-0 truncate">
                {slang.example_song_title}{slang.example_song_artist ? ` · ${slang.example_song_artist}` : ''}
              </span>
            </div>
            <div className="flex items-start gap-3">
              {song && (
                <button
                  onClick={() => navigate(`/song/${song.id}`)}
                  className="flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors mt-0.5"
                  title="Open this song"
                >
                  <Play className="h-4 w-4 fill-white" />
                </button>
              )}
              <div className="min-w-0">
                {slang.lyrics_snippet && (
                  <p className="text-sm italic text-[#a5603c] mb-1">"{slang.lyrics_snippet}"</p>
                )}
                {slang.lyrics_snippet_translation && (
                  <p className="text-sm text-muted-foreground">{slang.lyrics_snippet_translation}</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </CollapsibleCard>
  );
}