import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Play, Loader2, Volume2, Bookmark, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { youtubeSearch, detectGenre } from '@/lib/aiHelpers';
import { generateLyrics } from '@/lib/lyricsPipeline';
import PronunciationCheck from '@/components/song/PronunciationCheck';

export default function SlangOfTheDay() {
  const navigate = useNavigate();
  const [slang, setSlang] = useState(null);
  const [loading, setLoading] = useState(true);
  const [going, setGoing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePlay = async () => {
    if (going || !slang) return;
    setGoing(true);
    try {
      const query = `${slang.source_song} ${slang.source_artist}`;
      // Try to find an existing song matching title/artist
      const existing = await base44.entities.Song.filter({}, '-created_date', 200);
      const match = existing.find((s) => {
        const t = (s.title || '').toLowerCase();
        const a = (s.artist || '').toLowerCase();
        return t.includes(slang.source_song.toLowerCase()) || a.includes(slang.source_artist.toLowerCase());
      });
      if (match) {
        navigate(`/song/${match.id}`);
        return;
      }
      // Not in DB — search YouTube, create, and kick off lyrics pipeline
      const videos = await youtubeSearch({ query });
      const r = Array.isArray(videos) ? videos[0] : videos;
      if (!r?.youtube_id) throw new Error('No video found');
      const song = await base44.entities.Song.create({
        title: r.title || slang.source_song,
        artist: r.artist || slang.source_artist,
        youtube_id: r.youtube_id,
        sync_status: 'fetching_lyrics',
      });
      detectGenre({ title: song.title, artist: song.artist })
        .then((genre) => base44.entities.Song.update(song.id, { genre }))
        .catch(() => {});
      generateLyrics({ songId: song.id }).catch(() => {});
      navigate(`/song/${song.id}`);
    } catch {
      setGoing(false);
    }
  };

  const speak = () => {
    if (!slang) return;
    const u = new SpeechSynthesisUtterance(slang.term);
    u.lang = 'es-ES';
    u.rate = 0.85;
    speechSynthesis.speak(u);
  };

  useEffect(() => {
    if (!slang) return;
    base44.entities.SavedWord.filter({ word: slang.term })
      .then((rows) => setSaved(rows.length > 0))
      .catch(() => {});
  }, [slang]);

  const handleSave = async () => {
    if (saving || saved || !slang) return;
    setSaving(true);
    try {
      await base44.entities.SavedWord.create({
        word: slang.term,
        english_meaning: slang.meaning,
        pronunciation_hint: slang.pronunciation,
        is_slang: true,
      });
      setSaved(true);
    } catch {}
    setSaving(false);
  };

  useEffect(() => {
    let cancelled = false;
    base44.integrations.Core.InvokeLLM({
      prompt: 'Generate one Spanish slang word commonly heard in Latin music (reggaeton, bachata, etc). Include: the slang term, its literal translation, its actual meaning, an English slang equivalent, an example sentence in Spanish, the song and artist where it is famously heard, a short lyric excerpt containing the word with its English translation, and a pronunciation guide using English letters hyphenated by syllable with the stressed syllable in CAPITAL letters (e.g. al-MUER-zo) without slashes.',
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
          pronunciation: { type: 'string' },
        },
        required: ['term', 'literal', 'meaning', 'english_slang', 'example', 'source_song', 'source_artist', 'excerpt', 'excerpt_translation', 'pronunciation'],
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
      <h3 className="text-2xl font-bold text-foreground mb-1">{slang.term}</h3>
      <div className="flex items-center gap-3 mb-4">
        {slang.pronunciation && (
          <p className="text-sm italic text-muted-foreground">/{slang.pronunciation}/</p>
        )}
        <button
          onClick={speak}
          className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center hover:bg-primary/25 transition-colors active:scale-95"
          title="Listen to pronunciation"
        >
          <Volume2 className="h-4 w-4 text-primary" />
        </button>
        <PronunciationCheck targetText={slang.term} />
      </div>
      <div className="space-y-2.5 mb-4">
        {/* Dual box: literal + english slang side by side */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-muted/50 border border-border p-3">
            <span className="text-[10px] font-semibold text-muted-foreground/60 tracking-wide block mb-1">LITERAL</span>
            <p className="text-sm text-foreground">{slang.literal}</p>
          </div>
          <div className="rounded-xl bg-muted/50 border border-border p-3">
            <span className="text-[10px] font-semibold text-muted-foreground/60 tracking-wide block mb-1">ENGLISH SLANG</span>
            <p className="text-sm text-foreground">{slang.english_slang}</p>
          </div>
        </div>
        <DefRow label="MEANING" value={slang.meaning} />
        <DefRow label="EXAMPLE" value={slang.example} />
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
        <Music className="h-3.5 w-3.5" />
        <span className="font-medium">AS HEARD IN</span>
        <span className="text-foreground flex-1 min-w-0 truncate">{slang.source_song} · {slang.source_artist}</span>
      </div>
      <div className="flex items-start gap-3">
        <button
          onClick={handlePlay}
          disabled={going}
          className="flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-60 mt-0.5"
          title="Open this song"
        >
          {going ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-white" />}
        </button>
        <div className="min-w-0">
          <p className="text-sm italic text-[#a5603c] mb-1">"{slang.excerpt}"</p>
          <p className="text-sm text-muted-foreground">{slang.excerpt_translation}</p>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || saved}
        className={`w-full mt-4 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium transition-colors ${saved ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15'}`}
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
        {saved ? 'Saved to vocabulary' : 'Save to vocabulary'}
      </button>
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