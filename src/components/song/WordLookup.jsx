import React, { useState, useEffect } from 'react';
import { Volume2, BookmarkPlus, BookmarkCheck, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { translateWord, getCachedWordTranslation } from '@/lib/aiHelpers';
import { upsertGenreStatsOnWordSaved } from '@/lib/genres';

export default function WordLookup({ word, context, songId }) {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!word) { setInfo(null); setSaved(false); return; }
    // Instant render from the word-translation cache (no API call, no spinner)
    const cached = getCachedWordTranslation(word);
    if (cached) { setInfo(cached); setSaved(false); setLoading(false); return; }
    let cancelled = false;
    setInfo(null);
    setSaved(false);
    setLoading(true);
    translateWord({ word, context })
      .then((r) => { if (!cancelled) setInfo(r); })
      .catch(() => { if (!cancelled) setInfo({ english_meaning: 'Unavailable', pronunciation: word, part_of_speech: '', example_spanish: '', example_english: '' }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [word, context]);

  const handleSpeak = () => {
    const u = new SpeechSynthesisUtterance(word);
    u.lang = 'es-ES';
    u.rate = 0.8;
    speechSynthesis.speak(u);
  };

  const handleSave = async () => {
    if (!info || saving) return;
    setSaving(true);
    try {
      await base44.entities.SavedWord.create({
        word,
        english_meaning: info.english_meaning,
        pronunciation_hint: info.pronunciation,
        is_slang: info.is_slang || false,
        source_song_id: songId || null,
      });
      upsertGenreStatsOnWordSaved({ sourceSongId: songId }).catch(() => {});
      setSaved(true);
    } catch { /* noop */ }
    setSaving(false);
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-3 py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Looking up "{word}"…</span>
          </motion.div>
        )}
        {!loading && info && (
          <motion.div key="info" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-lg font-bold text-foreground">{word}</h4>
                <p className="text-sm text-muted-foreground italic">/{info.pronunciation}/</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleSpeak}
                  className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors active:scale-95">
                  <Volume2 className="h-4 w-4 text-primary" />
                </button>
                <button onClick={handleSave} disabled={saving || saved}
                  className={`h-9 w-9 rounded-full flex items-center justify-center transition-colors active:scale-95
                    ${saved ? 'bg-green-100 text-green-600' : 'bg-primary/10 hover:bg-primary/20 text-primary'}`}>
                  {saved ? <BookmarkCheck className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {/* Dual box: literal vs english slang */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-muted/50 border border-border p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">Literal</p>
                <p className="text-sm font-semibold text-foreground">{info.literal || info.english_meaning}</p>
              </div>
              <div className="rounded-xl bg-muted/50 border border-border p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">English Slang</p>
                <p className="text-sm font-semibold text-foreground">{info.english_slang || info.english_meaning}</p>
              </div>
            </div>
            {info.example_spanish && (
              <div className="bg-muted/50 rounded-xl p-3 space-y-1">
                <p className="text-sm font-medium">{info.example_spanish}</p>
                <p className="text-xs text-muted-foreground">{info.example_english}</p>
              </div>
            )}
          </motion.div>
        )}
        {!loading && !info && !word && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Tap any word in the lyrics to see its meaning and pronunciation.
          </p>
        )}
      </AnimatePresence>
    </div>
  );
}