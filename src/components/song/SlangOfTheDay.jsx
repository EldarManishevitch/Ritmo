import React, { useEffect, useState } from 'react';
import { Music, Volume2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SlangOfTheDay() {
  const [slang, setSlang] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    base44.integrations.Core.InvokeLLM({
      prompt: 'Generate one Spanish slang word commonly heard in Latin music (reggaeton, bachata, etc). Include: the slang term, its literal translation, its actual meaning, an English slang equivalent, an example sentence in Spanish, the song and artist where it is famously heard, and a short lyric excerpt containing the word with its English translation.',
      response_json_schema: {
        type: 'object',
        properties: {
          term: { type: 'string' },
          literal: { type: 'string' },
          meaning: { type: 'string' },
          english_slang: { type: 'string' },
          example: { type: 'string' },
          source_song: { type: 'string' },
          source_artist: { type: 'string' },
          excerpt: { type: 'string' },
          excerpt_translation: { type: 'string' },
        },
        required: ['term', 'literal', 'meaning', 'english_slang', 'example', 'source_song', 'source_artist', 'excerpt', 'excerpt_translation'],
      },
    })
      .then((s) => { if (!cancelled) setSlang(s); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="rounded-2xl bg-card border border-border p-5 animate-pulse h-56" />;
  }
  if (!slang) return null;

  return (
    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
      <span className="inline-block text-xs font-semibold text-white bg-[#2d3e4e] px-2.5 py-1 rounded-md mb-3">
        Slang of the Day
      </span>
      <h3 className="text-2xl font-bold text-foreground mb-4">{slang.term}</h3>
      <div className="space-y-2.5 mb-4">
        <DefRow label="LITERAL" value={slang.literal} />
        <DefRow label="MEANING" value={slang.meaning} />
        <DefRow label="ENGLISH SLANG" value={slang.english_slang} />
        <DefRow label="EXAMPLE" value={slang.example} />
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
        <Music className="h-3.5 w-3.5" />
        <span className="font-medium">AS HEARD IN</span>
        <span className="text-foreground">{slang.source_song} · {slang.source_artist}</span>
      </div>
      <p className="text-sm italic text-[#a5603c] mb-1">"{slang.excerpt}"</p>
      <p className="text-sm text-muted-foreground">{slang.excerpt_translation}</p>
    </div>
  );
}

function DefRow({ label, value }) {
  return (
    <div>
      <span className="text-[10px] font-semibold text-muted-foreground/60 tracking-wide">{label}</span>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}