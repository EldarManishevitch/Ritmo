import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, Bookmark } from 'lucide-react';

const LINES = [
  'Tú me preguntó que si me enamoré',
  'Yo te contesté que no, que qué pasó',
  'Tú sabes que yo contigo me porté',
  'Con cariño y con amor yo te traté',
];

const GLOSSARY = {
  preguntó: { en: 'asked', pron: 'preh-goon-TOH' },
  enamoré: { en: 'fell in love', pron: 'eh-nah-moh-REH' },
  contesté: { en: 'answered', pron: 'kon-tes-TEH' },
  pasó: { en: 'happened', pron: 'pah-SOH' },
  sabes: { en: 'you know', pron: 'SAH-bes' },
  conmigo: { en: 'with me', pron: '' },
  porté: { en: 'behaved', pron: '' },
  cariño: { en: 'affection', pron: 'kah-REE-nyoh' },
  amor: { en: 'love', pron: 'ah-MOR' },
  traté: { en: 'treated', pron: '' },
};

const cleanWord = (w) => w.toLowerCase().replace(/[¿¡!?.,;:"'()]/g, '').trim();

export default function InteractiveLyrics() {
  const navigate = useNavigate();
  const [selectedWord, setSelectedWord] = useState(null);
  const [activeLine, setActiveLine] = useState(0);
  const cardRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLine((prev) => (prev + 1) % LINES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedWord) return;
    const handler = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        setSelectedWord(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [selectedWord]);

  const speak = (word) => {
    const u = new SpeechSynthesisUtterance(word);
    u.lang = 'es-MX';
    u.rate = 0.85;
    speechSynthesis.speak(u);
  };

  const renderLine = (line) =>
    line.split(/\s+/).map((w, wi) => {
      const c = cleanWord(w);
      const has = Boolean(GLOSSARY[c]);
      return (
        <span
          key={wi}
          onClick={() => has && setSelectedWord(c)}
          className={`inline-block mr-1 px-1.5 py-0.5 rounded-md transition-all ${
            has ? 'cursor-pointer hover:bg-white/15' : 'cursor-default opacity-60'
          } ${selectedWord === c ? 'bg-white/25 text-white' : ''}`}
        >
          {w}
        </span>
      );
    });

  return (
    <div ref={cardRef}>
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs text-white/60">▶ Playing: Tití Me Preguntó — Bad Bunny</span>
      </div>

      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-6 space-y-3">
        {LINES.map((line, li) => (
          <p
            key={li}
            className={`text-xl text-white/80 leading-relaxed rounded-lg px-3 py-2 transition-all duration-500 ${
              activeLine === li ? 'bg-primary/20 text-white scale-[1.02]' : ''
            }`}
          >
            {renderLine(line)}
          </p>
        ))}
      </div>

      {selectedWord && GLOSSARY[selectedWord] ? (
        <div className="mt-4 rounded-xl bg-card border border-border p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-2xl font-bold text-foreground">{selectedWord}</h3>
            <button
              onClick={() => speak(selectedWord)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
            >
              <Volume2 className="h-4 w-4" /> Hear
            </button>
          </div>
          <p className="text-base text-foreground mb-1">
            <strong>English:</strong> {GLOSSARY[selectedWord].en}
          </p>
          {GLOSSARY[selectedWord].pron && (
            <p className="text-sm text-muted-foreground mb-3">
              <strong>Sounds like:</strong> {GLOSSARY[selectedWord].pron}
            </p>
          )}
          <button
            onClick={() => navigate('/register')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors w-full justify-center"
          >
            <Bookmark className="h-4 w-4" /> Save to vocab →
          </button>
          <p className="text-xs text-muted-foreground text-center mt-2">Sign up to save words</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          Tap any highlighted word above to see its translation and pronunciation.
        </p>
      )}
    </div>
  );
}