import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const GENERIC_NOTES = [
  { title: 'Listen for the rhythm', body: 'Try tapping along to the beat before diving into the words. Feeling the rhythm helps your brain process the language faster.' },
  { title: 'Caribbean Spanish', body: 'Latin music is full of dropped sounds and slang. Listen for how the artist shapes words differently than textbook Spanish.' },
  { title: 'Sing along soon', body: 'Once the audio is ready, try singing the chorus. Pronunciation sticks faster when your mouth moves with the music.' },
];

export default function WarmUpCard({ songId, artist, genre }) {
  const [slangTerms, setSlangTerms] = useState([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!songId) return;
    base44.entities.SlangDictionary.filter({ song_id: songId }, 'term', 20)
      .then((list) => setSlangTerms(list || []))
      .catch(() => {});
  }, [songId]);

  useEffect(() => {
    const interval = setInterval(() => setIdx((i) => i + 1), 4000);
    return () => clearInterval(interval);
  }, []);

  const items = slangTerms.length > 0
    ? slangTerms.map((s) => ({ title: s.term, body: s.contextual_meaning, isSlang: true }))
    : [
        { title: `About ${artist || 'this artist'}`, body: `${artist || 'This artist'} is known for ${genre || 'Latin'} music. Listen for the unique flow and slang that defines this style.` },
        ...GENERIC_NOTES,
      ];

  const current = items[idx % items.length];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar">
      <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
        <Sparkles className="h-3 w-3" /> While the song loads…
      </p>
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl bg-primary/5 border border-primary/20 p-5"
        >
          {current.isSlang && (
            <span className="inline-block text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-2">Slang</span>
          )}
          <h3 className="text-lg font-bold text-primary mb-1">{current.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{current.body}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}