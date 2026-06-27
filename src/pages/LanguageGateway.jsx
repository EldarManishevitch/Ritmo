import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LANGUAGES } from '@/lib/LanguageContext';

const getLang = (l) => l.lang.toLowerCase();

export default function LanguageGateway() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(LANGUAGES[0]);

  const handleStart = () => {
    localStorage.setItem('selected_learning_language', selected.lang);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FBF9F6' }}>
      {/* Minimal brand bar */}
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-center">
        <div className="flex items-center gap-2" style={{ color: '#2C2A29' }}>
          <Music style={{ color: '#D96B43' }} className="h-5 w-5" />
          <span className="font-bold text-lg">Ritmo</span>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 pt-8 pb-20 text-center">
        <h1
          className="text-4xl md:text-5xl font-bold mb-4 leading-tight"
          style={{ color: '#2C2A29' }}
        >
          What language would you like to learn today?
        </h1>
        <p className="text-base mb-10" style={{ color: '#B8B4AE' }}>
          Pick a language and start learning through synced music lyrics, instant translations, and AI-powered practice.
        </p>

        {/* Language cards grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-10">
          {LANGUAGES.map((lang) => {
            const active = getLang(lang) === getLang(selected);
            return (
              <button
                key={lang.lang}
                onClick={() => setSelected(lang)}
                className={`flex flex-col items-center justify-center gap-3 rounded-xl p-6 transition-all ${
                  active
                    ? 'border-2 shadow-md'
                    : 'border hover:shadow-sm hover:bg-white'
                }`}
                style={active
                  ? { borderColor: '#D96B43', backgroundColor: '#FFFFFF' }
                  : { borderColor: 'rgba(0,0,0,0.08)', backgroundColor: '#FFFFFF' }
                }
              >
                <span className="text-4xl">{lang.flag}</span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: active ? '#D96B43' : '#2C2A29' }}
                >
                  {lang.lang}
                </span>
                <span className="text-xs" style={{ color: '#9B9793' }}>
                  {lang.nativeName}
                </span>
              </button>
            );
          })}
        </div>

        {/* Start button */}
        <Button
          onClick={handleStart}
          size="lg"
          className="h-14 px-12 text-base font-bold text-white shadow-lg"
          style={{ backgroundColor: '#D96B43', borderRadius: '9999px' }}
        >
          <Sparkles className="h-5 w-5" />
          Start Learning {selected.flag}
        </Button>
      </main>
    </div>
  );
}