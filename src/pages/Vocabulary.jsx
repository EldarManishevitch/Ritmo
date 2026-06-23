import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BookOpen, Volume2, Trash2, Check, Search, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

export default function Vocabulary() {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.SavedWord.list('-created_date', 100);
        setWords(data);
      } catch (e) {}
      setLoading(false);
    };
    load();
  }, []);

  const handleSpeak = (word) => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'es-ES';
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  };

  const handleToggleMastered = async (word) => {
    try {
      await base44.entities.SavedWord.update(word.id, { mastered: !word.mastered });
      setWords(prev => prev.map(w => w.id === word.id ? { ...w, mastered: !w.mastered } : w));
    } catch (e) {}
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.SavedWord.delete(id);
      setWords(prev => prev.filter(w => w.id !== id));
    } catch (e) {}
  };

  const filtered = words.filter(w => {
    const matchSearch = !search ||
      w.spanish_word?.toLowerCase().includes(search.toLowerCase()) ||
      w.english_meaning?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' ||
      (filter === 'mastered' && w.mastered) ||
      (filter === 'learning' && !w.mastered);
    return matchSearch && matchFilter;
  });

  const masteredCount = words.filter(w => w.mastered).length;

  return (
    <div className="min-h-screen">
      <div className="px-5 pt-14 pb-4">
        <h1 className="text-2xl font-bold mb-1">My Vocabulary</h1>
        <p className="text-sm text-muted-foreground">
          {words.length} words saved · {masteredCount} mastered
        </p>
      </div>

      {/* Progress bar */}
      {words.length > 0 && (
        <div className="px-5 pb-4">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${words.length > 0 ? (masteredCount / words.length) * 100 : 0}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-primary to-orange-400"
            />
          </div>
        </div>
      )}

      {/* Search */}
      <div className="px-5 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your words…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-muted/50 border-0 focus-visible:ring-primary/30"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="px-5 pb-4 flex gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'learning', label: 'Learning' },
          { key: 'mastered', label: 'Mastered' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all
              ${filter === f.key
                ? 'bg-primary text-white shadow-sm'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Word list */}
      <div className="px-5 pb-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-2.5">
            <AnimatePresence>
              {filtered.map((word, idx) => (
                <motion.div
                  key={word.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.25, delay: idx * 0.03 }}
                  className={`bg-card rounded-2xl border p-4 transition-all
                    ${word.mastered ? 'border-green-200 bg-green-50/30' : 'border-border/50'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-base">{word.spanish_word}</h4>
                        {word.mastered && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                            Mastered
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{word.english_meaning}</p>
                      {word.pronunciation_hint && (
                        <p className="text-xs text-muted-foreground italic mt-0.5">/{word.pronunciation_hint}/</p>
                      )}
                      {word.song_title && (
                        <p className="text-[11px] text-muted-foreground/60 mt-1.5">from "{word.song_title}"</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleSpeak(word.spanish_word)}
                        className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors active:scale-95"
                      >
                        <Volume2 className="h-3.5 w-3.5 text-primary" />
                      </button>
                      <button
                        onClick={() => handleToggleMastered(word)}
                        className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors active:scale-95
                          ${word.mastered ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-muted/60 text-muted-foreground hover:bg-muted'}`}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(word.id)}
                        className="h-8 w-8 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors active:scale-95"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-16 space-y-3">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">
              {search || filter !== 'all' ? 'No matching words' : 'No saved words yet'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {search || filter !== 'all'
                ? 'Try a different search or filter.'
                : 'Tap words in song lyrics to look them up, then save them here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}