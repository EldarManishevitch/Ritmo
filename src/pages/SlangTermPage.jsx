import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Volume2, ArrowRight, Loader2, BookOpen } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import BlogLayout from '@/components/layout/BlogLayout';
import SEOHead from '@/components/SEOHead';
import PageNotFound from '@/lib/PageNotFound';

export default function SlangTermPage() {
  const { term } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const results = await base44.entities.SlangDictionary.filter({}, 'term', 500);
        if (cancelled) return;
        const match = results.find((s) => s.term?.toLowerCase() === decodeURIComponent(term).toLowerCase());
        if (match) setData(match);
      } catch { /* noop */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [term]);

  const speak = (text) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-MX';
    u.rate = 0.8;
    speechSynthesis.speak(u);
  };

  if (loading) {
    return (
      <BlogLayout>
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </BlogLayout>
    );
  }

  if (!data) return <PageNotFound />;

  return (
    <BlogLayout badge="Slang Dictionary">
      <SEOHead
        title={`${data.term} meaning in Spanish — reggaeton slang explained | Spanish Beats`}
        description={`What does '${data.term}' mean? ${data.contextual_meaning}. Hear it used in ${data.example_song_title || 'reggaeton'} by ${data.example_song_artist || 'popular artists'}. Learn reggaeton slang on Spanish Beats.`}
      />
      <article>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">What does '{data.term}' mean in Spanish?</h1>

        {/* Quick definition */}
        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-6 mb-6">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Definition</p>
          <p className="text-xl font-medium text-foreground">{data.contextual_meaning}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {data.literal_meaning && (
            <div className="rounded-xl bg-card border border-border p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Literal meaning</p>
              <p className="text-foreground">{data.literal_meaning}</p>
            </div>
          )}
          {data.english_equivalent && (
            <div className="rounded-xl bg-card border border-border p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">English equivalent</p>
              <p className="text-foreground">{data.english_equivalent}</p>
            </div>
          )}
        </div>

        {/* Example usage */}
        {data.example_usage && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-foreground mb-3">Example usage</h2>
            <blockquote className="rounded-xl bg-card border-l-4 border-primary border border-border p-5">
              <p className="text-foreground italic">"{data.example_usage}"</p>
            </blockquote>
          </div>
        )}

        {/* Heard in music */}
        {data.lyrics_snippet && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-foreground mb-3">Heard in music</h2>
            <div className="rounded-2xl bg-slate-900 p-6">
              {data.example_song_title && (
                <p className="text-xs text-white/50 mb-3">
                  As heard in{' '}
                  {data.song_id ? (
                    <Link to={`/song/${data.song_id}`} className="text-primary/80 hover:text-primary hover:underline">
                      "{data.example_song_title}" by {data.example_song_artist}
                    </Link>
                  ) : (
                    <>"{data.example_song_title}" by {data.example_song_artist}</>
                  )}
                </p>
              )}
              <p className="text-lg text-white font-medium leading-relaxed mb-3">"{data.lyrics_snippet}"</p>
              {data.lyrics_snippet_translation && (
                <p className="text-sm text-white/60 italic">{data.lyrics_snippet_translation}</p>
              )}
            </div>
          </div>
        )}

        {/* Hear pronunciation */}
        <div className="mb-8">
          <Button variant="outline" onClick={() => speak(data.term)}>
            <Volume2 className="h-4 w-4 mr-2" /> Hear the pronunciation
          </Button>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/reggaeton-slang-guide">
            <Button variant="outline" className="w-full sm:w-auto">
              <BookOpen className="h-4 w-4 mr-2" /> Learn more Spanish slang <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
          <Link to="/register">
            <Button className="w-full sm:w-auto bg-primary text-white">
              Try Spanish Beats free <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </article>
    </BlogLayout>
  );
}