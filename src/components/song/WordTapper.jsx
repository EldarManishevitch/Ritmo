import React, { useState } from 'react';
import { Volume2, BookmarkPlus, BookmarkCheck, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

export default function WordTapper({ lyricsLines = [], songId, songTitle }) {
  const [selectedWord, setSelectedWord] = useState(null);
  const [wordInfo, setWordInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleWordTap = async (word) => {
    const clean = word.replace(/[^a-záéíóúüñ]/gi, '');
    if (!clean) return;
    setSelectedWord(clean);
    setWordInfo(null);
    setSaved(false);
    setLoading(true);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a Spanish language tutor. For the Spanish word "${clean}", provide:
1. The English translation (most common meaning)
2. A simple pronunciation guide using English phonetics
3. Part of speech (noun, verb, adjective, etc.)
4. A short example sentence in Spanish with English translation

Be concise and helpful for a beginner learner.`,
        response_json_schema: {
          type: "object",
          properties: {
            english: { type: "string" },
            pronunciation: { type: "string" },
            part_of_speech: { type: "string" },
            example_es: { type: "string" },
            example_en: { type: "string" }
          }
        }
      });
      setWordInfo(result);
    } catch (e) {
      setWordInfo({ english: "Translation unavailable", pronunciation: clean, part_of_speech: "", example_es: "", example_en: "" });
    }
    setLoading(false);
  };

  const handleSpeak = () => {
    if (!selectedWord) return;
    const utterance = new SpeechSynthesisUtterance(selectedWord);
    utterance.lang = 'es-ES';
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  };

  const handleSave = async () => {
    if (!wordInfo || saving) return;
    setSaving(true);
    try {
      await base44.entities.SavedWord.create({
        spanish_word: selectedWord,
        english_meaning: wordInfo.english,
        pronunciation_hint: wordInfo.pronunciation,
        song_id: songId,
        song_title: songTitle
      });
      setSaved(true);
    } catch (e) {
      // silently fail
    }
    setSaving(false);
  };

  const words = lyricsLines.map(line =>
    line.split(/\s+/).filter(Boolean)
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {words.map((lineWords, lineIdx) => (
          <p key={lineIdx} className="text-base font-medium leading-relaxed">
            {lineWords.map((word, wordIdx) => {
              const clean = word.replace(/[^a-záéíóúüñ]/gi, '');
              const isSelected = clean.toLowerCase() === selectedWord?.toLowerCase();
              return (
                <button
                  key={`${lineIdx}-${wordIdx}`}
                  type="button"
                  onClick={() => handleWordTap(word)}
                  className={`inline-block mr-1.5 mb-1 px-2 py-1 rounded-lg transition-all duration-200 text-base
                    ${isSelected
                      ? 'bg-primary text-white shadow-md scale-105'
                      : 'hover:bg-primary/10 hover:text-primary active:scale-95'
                    }`}
                >
                  {word}
                </button>
              );
            })}
          </p>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-5 flex items-center justify-center gap-3"
          >
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Looking up "{selectedWord}"…</span>
          </motion.div>
        )}

        {!loading && wordInfo && (
          <motion.div
            key="info"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-5 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-lg font-bold text-foreground">{selectedWord}</h4>
                <p className="text-sm text-muted-foreground italic">/{wordInfo.pronunciation}/</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSpeak}
                  className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors active:scale-95"
                >
                  <Volume2 className="h-4 w-4 text-primary" />
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || saved}
                  className={`h-9 w-9 rounded-full flex items-center justify-center transition-colors active:scale-95
                    ${saved ? 'bg-green-100 text-green-600' : 'bg-primary/10 hover:bg-primary/20 text-primary'}`}
                >
                  {saved ? <BookmarkCheck className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
                  {wordInfo.part_of_speech}
                </span>
                <span className="text-sm font-semibold text-foreground">{wordInfo.english}</span>
              </div>
              {wordInfo.example_es && (
                <div className="bg-white/60 rounded-xl p-3 space-y-1">
                  <p className="text-sm font-medium">{wordInfo.example_es}</p>
                  <p className="text-xs text-muted-foreground">{wordInfo.example_en}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {!loading && !wordInfo && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-5"
          >
            <p className="text-sm text-muted-foreground text-center">
              Tap any word above to hear it and see what it means.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}