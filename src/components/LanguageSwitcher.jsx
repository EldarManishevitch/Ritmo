import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { useLanguage, LANGUAGES } from '@/lib/LanguageContext';

export default function LanguageSwitcher() {
  const navigate = useNavigate();
  const { lang, flag } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (l) => {
    localStorage.setItem('selected_learning_language', l.lang);
    setOpen(false);
    navigate('/dashboard');
    navigate(0); // Force refresh to apply language change site-wide
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="hidden sm:flex items-center gap-1.5 rounded-full border border-border bg-card hover:bg-muted px-3 py-1.5 text-sm whitespace-nowrap transition-colors"
        title="Switch language"
      >
        <Globe className="h-4 w-4 text-muted-foreground" />
        <span>{flag}</span>
        <span className="font-medium text-foreground">{lang}</span>
      </button>
      <button
        onClick={() => setOpen((o) => !o)}
        className="sm:hidden p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
        title="Switch language"
      >
        <Globe className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-border bg-card shadow-lg py-1 z-50">
          {LANGUAGES.map((l) => {
            const active = l.lang === lang;
            return (
              <button
                key={l.lang}
                onClick={() => handleSelect(l)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  active ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'
                }`}
              >
                <span className="text-lg">{l.flag}</span>
                <div className="text-left">
                  <span className="block">{l.lang}</span>
                  <span className="block text-xs text-muted-foreground">{l.nativeName}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}